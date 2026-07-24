/**
 * IssueTriageWorkflow — Main LangGraph workflow
 *
 * Flow:
 *
 *   START
 *     │
 *   receiveIssue ──▶ fetchRepoContext ──▶ fetchSimilarIssues
 *     │
 *   generateEmbedding ──▶ compareSimilarity
 *     │                          │
 *     │              isDuplicate=true ──▶ markDuplicate ──▶ updateGitHub ──▶ saveResults ──▶ notifyReportService ──▶ END
 *     │              isDuplicate=false ──▶ reasonWithLLM ──▶ predictLabels ──▶ updateGitHub ──▶ saveResults ──▶ notifyReportService ──▶ END
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { IssueTriageState } from './workflowState.js';
import { triageMemory } from '../memory/triageMemory.js';
import { runTriageAgent } from '../agents/TriageAgent.js';
import { generateTextEmbedding, cosineSimilarity } from '../tools/embeddingTools.js';
import * as githubTools from '../tools/githubTools.js';
import * as reportTools from '../tools/reportTools.js';
import { LABEL_PREDICTION_PROMPT } from '../prompts/triagePrompts.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { IssuePayload } from '../types/index.js';

// Issues with cosine similarity above this threshold are flagged as duplicates
const DUPLICATE_THRESHOLD = 0.88;

// ---- LLM factory (shared across nodes that need it) -----------------------

const createModel = () => {
  if (env.GEMINI_API_KEY) {
    return new ChatGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY, model: 'gemini-2.0-flash', maxOutputTokens: 1024 });
  }
  if (env.OPENAI_API_KEY) {
    return new ChatOpenAI({ apiKey: env.OPENAI_API_KEY, modelName: 'gpt-4o-mini', temperature: 0.1 });
  }
  return null;
};

// ---- Node 1: receiveIssue -------------------------------------------------

// Entry point — log the incoming issue and pass through unchanged
const receiveIssueNode = async (state: typeof IssueTriageState.State) => {
  const { number, title, owner, repoName } = state.issue;
  logger.info(`[Workflow:receiveIssue] New issue received: ${owner}/${repoName}#${number} — "${title}"`);
  return {};
};

// ---- Node 2: fetchRepoContext ---------------------------------------------

// Fetch the repository's metadata from the github-service
const fetchRepoContextNode = async (state: typeof IssueTriageState.State) => {
  const { owner, repoName } = state.issue;
  logger.info(`[Workflow:fetchRepoContext] Fetching context for ${owner}/${repoName}`);

  const repoContext = await githubTools.fetchRepoContext(owner, repoName);
  return { repoContext };
};

// ---- Node 3: fetchSimilarIssues -------------------------------------------

// Retrieve all open issues from the same repo — these are candidates for duplicate detection
const fetchSimilarIssuesNode = async (state: typeof IssueTriageState.State) => {
  const { owner, repoName } = state.issue;
  logger.info(`[Workflow:fetchSimilarIssues] Fetching open issues for ${owner}/${repoName}`);

  const similarIssues = await githubTools.fetchRepoIssues(owner, repoName);

  // Exclude the current issue itself from the list
  const filtered = similarIssues.filter((i) => i.number !== state.issue.number);
  logger.info(`[Workflow:fetchSimilarIssues] Found ${filtered.length} candidate issue(s)`);

  return { similarIssues: filtered };
};

// ---- Node 4: generateEmbedding --------------------------------------------

// Create a vector embedding for the incoming issue's title + body
const generateEmbeddingNode = async (state: typeof IssueTriageState.State) => {
  const { title, body } = state.issue;
  logger.info(`[Workflow:generateEmbedding] Generating embedding for issue #${state.issue.number}`);

  // Combine title + body into a single text for a richer embedding
  const text = `${title}\n\n${body}`;
  const issueEmbedding = await generateTextEmbedding(text);

  return { issueEmbedding };
};

// ---- Node 5: compareSimilarity --------------------------------------------

// Compare the new issue embedding against all existing issues to detect duplicates
const compareSimilarityNode = async (state: typeof IssueTriageState.State) => {
  logger.info(`[Workflow:compareSimilarity] Comparing against ${state.similarIssues.length} existing issue(s)`);

  // If we have no embedding (no API key), skip duplicate detection
  if (state.issueEmbedding.length === 0) {
    logger.warn('[Workflow:compareSimilarity] No embedding available — skipping duplicate detection');
    return { similarityScore: 0, duplicateOfNumber: null, isDuplicate: false };
  }

  let highestScore = 0;
  let closestIssueNumber: number | null = null;

  for (const candidate of state.similarIssues) {
    // Generate an embedding for each candidate issue
    const candidateText = `${candidate.title}\n\n${candidate.body}`;
    const candidateEmbedding = await generateTextEmbedding(candidateText);

    const score = cosineSimilarity(state.issueEmbedding, candidateEmbedding);

    if (score > highestScore) {
      highestScore = score;
      closestIssueNumber = candidate.number;
    }
  }

  const isDuplicate = highestScore >= DUPLICATE_THRESHOLD;

  logger.info(
    `[Workflow:compareSimilarity] Best match: issue #${closestIssueNumber ?? 'none'} ` +
    `(score=${highestScore.toFixed(3)}, isDuplicate=${isDuplicate})`
  );

  return {
    similarityScore: highestScore,
    duplicateOfNumber: isDuplicate ? closestIssueNumber : null,
    isDuplicate,
  };
};

// ---- Conditional Edge: routeAfterSimilarity --------------------------------

// Decides which node to go to after compareSimilarity based on the isDuplicate flag
const routeAfterSimilarity = (state: typeof IssueTriageState.State): string => {
  return state.isDuplicate ? 'markDuplicate' : 'reasonWithLLM';
};

// ---- Node 6a: markDuplicate (duplicate path) ------------------------------

// Post a "duplicate of #X" comment on the issue
const markDuplicateNode = async (state: typeof IssueTriageState.State) => {
  const { owner, repoName, number } = state.issue;
  logger.info(`[Workflow:markDuplicate] Issue #${number} is duplicate of #${state.duplicateOfNumber}`);

  await githubTools.markIssueAsDuplicate(owner, repoName, number, state.duplicateOfNumber!);

  return {};
};

// ---- Node 6b: reasonWithLLM (non-duplicate path) --------------------------

// Use the AI agent to deeply analyse the issue: category, priority, burnout risk
const reasonWithLLMNode = async (state: typeof IssueTriageState.State) => {
  const { title, body } = state.issue;
  logger.info(`[Workflow:reasonWithLLM] Running LLM analysis on issue #${state.issue.number}`);

  const llmAnalysis = await runTriageAgent(title, body);

  return {
    llmAnalysis,
    burnoutRisk: llmAnalysis.burnoutRisk,
  };
};

// ---- Node 7: predictLabels ------------------------------------------------

// Use the LLM analysis to predict specific GitHub labels and priority for the issue
const predictLabelsNode = async (state: typeof IssueTriageState.State) => {
  logger.info(`[Workflow:predictLabels] Predicting labels for issue #${state.issue.number}`);

  const model = createModel();

  // If no LLM is available, derive simple labels directly from the analysis
  if (!model || !state.llmAnalysis) {
    const analysis = state.llmAnalysis;
    const labels = analysis
      ? [`${analysis.category}`, `priority: ${analysis.priority}`, ...(analysis.burnoutRisk ? ['burnout-risk'] : [])]
      : ['needs-triage'];

    return {
      predictedLabels: labels,
      predictedPriority: analysis?.priority ?? 'low',
    };
  }

  try {
    const input = JSON.stringify({
      category: state.llmAnalysis.category,
      priority: state.llmAnalysis.priority,
      burnoutRisk: state.llmAnalysis.burnoutRisk,
    });

    const response = await model.invoke([
      new SystemMessage(LABEL_PREDICTION_PROMPT),
      new HumanMessage(`Issue analysis:\n${input}`),
    ]);

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());

    return {
      predictedLabels: parsed.labels ?? [],
      predictedPriority: parsed.priority ?? state.llmAnalysis.priority,
    };
  } catch (err: any) {
    // Fall back to simple label derivation if the LLM call fails
    logger.warn(`[Workflow:predictLabels] LLM call failed: ${err.message} — using fallback labels`);
    const analysis = state.llmAnalysis;
    return {
      predictedLabels: [analysis.category, `priority: ${analysis.priority}`],
      predictedPriority: analysis.priority,
    };
  }
};

// ---- Node 8: updateGitHub -------------------------------------------------

// Apply the predicted labels and post a comment if the issue has burnout risk
const updateGitHubNode = async (state: typeof IssueTriageState.State) => {
  const { owner, repoName, number } = state.issue;
  logger.info(`[Workflow:updateGitHub] Applying changes to ${owner}/${repoName}#${number}`);

  const logs: string[] = [];

  // If duplicate — just apply a "duplicate" label, the comment was already posted
  if (state.isDuplicate) {
    const ok = await githubTools.addLabelsToIssue(owner, repoName, number, ['duplicate']);
    logs.push(`Applied label [duplicate]: ${ok ? 'success' : 'failed'}`);
    return { executionLogs: logs };
  }

  // Apply all predicted labels in one batch call
  if (state.predictedLabels.length > 0) {
    const ok = await githubTools.addLabelsToIssue(owner, repoName, number, state.predictedLabels);
    logs.push(`Applied labels [${state.predictedLabels.join(', ')}]: ${ok ? 'success' : 'failed'}`);
  }

  // Post a maintainer-wellbeing comment if the issue has a demanding/toxic tone
  if (state.burnoutRisk) {
    const comment =
      'Thanks for opening this issue!\n\n' +
      'Our maintainers are volunteers — please be kind and patient. We appreciate it!';
    const ok = await githubTools.postCommentToIssue(owner, repoName, number, comment);
    logs.push(`Posted burnout-risk comment: ${ok ? 'success' : 'failed'}`);
  }

  return { executionLogs: logs };
};

// ---- Node 9: saveResults --------------------------------------------------

// Log and persist the final triage result (in-memory for now; extend with DB write as needed)
const saveResultsNode = async (state: typeof IssueTriageState.State) => {
  const { number, owner, repoName } = state.issue;

  logger.info(
    `[Workflow:saveResults] Triage complete for ${owner}/${repoName}#${number} — ` +
    `isDuplicate=${state.isDuplicate}, labels=[${state.predictedLabels?.join(', ') ?? ''}]`
  );

  // Log each execution step for observability
  for (const log of state.executionLogs ?? []) {
    logger.info(`  → ${log}`);
  }

  return {};
};

// ---- Node 10: notifyReportService ----------------------------------------

// Fire-and-forget: send the full triage report to the report-service
const notifyReportServiceNode = async (state: typeof IssueTriageState.State) => {
  logger.info(`[Workflow:notifyReportService] Sending report for issue #${state.issue.number}`);

  const reported = await reportTools.notifyReportService({
    issue: state.issue,
    isDuplicate: state.isDuplicate ?? false,
    duplicateOfNumber: state.duplicateOfNumber ?? null,
    analysis: state.llmAnalysis ?? null,
    predictedLabels: state.predictedLabels ?? [],
    predictedPriority: state.predictedPriority ?? 'low',
    executionLogs: state.executionLogs ?? [],
    triageCompletedAt: new Date().toISOString(),
  });

  return { reported };
};

// ---- Graph Assembly -------------------------------------------------------

const workflow = new StateGraph(IssueTriageState)

  // Register all nodes
  .addNode('receiveIssue', receiveIssueNode)
  .addNode('fetchRepoContext', fetchRepoContextNode)
  .addNode('fetchSimilarIssues', fetchSimilarIssuesNode)
  .addNode('generateEmbedding', generateEmbeddingNode)
  .addNode('compareSimilarity', compareSimilarityNode)
  .addNode('markDuplicate', markDuplicateNode)       // duplicate path
  .addNode('reasonWithLLM', reasonWithLLMNode)       // non-duplicate path
  .addNode('predictLabels', predictLabelsNode)
  .addNode('updateGitHub', updateGitHubNode)
  .addNode('saveResults', saveResultsNode)
  .addNode('notifyReportService', notifyReportServiceNode)

  // Linear edges: START → receiveIssue → ... → compareSimilarity
  .addEdge(START, 'receiveIssue')
  .addEdge('receiveIssue', 'fetchRepoContext')
  .addEdge('fetchRepoContext', 'fetchSimilarIssues')
  .addEdge('fetchSimilarIssues', 'generateEmbedding')
  .addEdge('generateEmbedding', 'compareSimilarity')

  // Conditional edge: duplicate → markDuplicate | not duplicate → reasonWithLLM
  .addConditionalEdges('compareSimilarity', routeAfterSimilarity, {
    markDuplicate: 'markDuplicate',
    reasonWithLLM: 'reasonWithLLM',
  })

  // Duplicate path: markDuplicate → updateGitHub (skip label prediction)
  .addEdge('markDuplicate', 'updateGitHub')

  // Non-duplicate path: reasonWithLLM → predictLabels → updateGitHub
  .addEdge('reasonWithLLM', 'predictLabels')
  .addEdge('predictLabels', 'updateGitHub')

  // Both paths converge here: updateGitHub → saveResults → notifyReportService → END
  .addEdge('updateGitHub', 'saveResults')
  .addEdge('saveResults', 'notifyReportService')
  .addEdge('notifyReportService', END);

export const issueTriageWorkflow = workflow.compile({ checkpointer: triageMemory });

// ---- Public entry point ---------------------------------------------------

// Run the full IssueTriageWorkflow for a single issue
export const runWorkflow = async (issue: IssuePayload) => {
  const config = { configurable: { thread_id: `triage-${issue.issueId}` } };
  logger.info(`[IssueTriageWorkflow] Starting workflow for thread: ${config.configurable.thread_id}`);

  const finalState = await issueTriageWorkflow.invoke({ issue }, config);

  logger.info(`[IssueTriageWorkflow] Workflow complete for thread: ${config.configurable.thread_id}`);
  return finalState;
};
