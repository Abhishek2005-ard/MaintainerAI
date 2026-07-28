import { StateGraph, START, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { triageMemory } from '../memory/triageMemory.js';
import { runTriageAgent } from '../agents/TriageAgent.js';
import { predictLabels } from '../agents/LabelAgent.js';
import { detectDuplicate } from '../agents/DuplicateAgent.js';
import * as GitHub from '../agents/GitHubAgent.js';
import { sendReport } from '../agents/ReportAgent.js';
import { logger } from '../utils/logger.js';

// ── Graph State ───────────────────────────────────────────────────────────────
// Every node receives this state and returns a partial update.

const State = Annotation.Root({
  issue:             Annotation(),
  repoContext:       Annotation(),
  openIssues:        Annotation(),
  issueEmbedding:    Annotation(),
  similarityScore:   Annotation(),
  isDuplicate:       Annotation(),
  duplicateOfNumber: Annotation(),
  llmAnalysis:       Annotation(),
  predictedLabels:   Annotation(),
  predictedPriority: Annotation(),
  burnoutRisk:       Annotation(),
  executionLogs:     Annotation(),
  reported:          Annotation(),
});

// ── Nodes ─────────────────────────────────────────────────────────────────────
// Each node does exactly one thing and delegates to the matching agent.

const receiveIssue = async (s) => {
  logger.info(`Issue received: ${s.issue.owner}/${s.issue.repoName}#${s.issue.number} — "${s.issue.title}"`);
  return {};
};

const fetchRepoContext = async (s) => ({
  repoContext: await GitHub.fetchRepoContext(s.issue.owner, s.issue.repoName),
});

const fetchOpenIssues = async (s) => ({
  openIssues: await GitHub.fetchOpenIssues(s.issue.owner, s.issue.repoName, s.issue.number),
});

const runDuplicateCheck = async (s) => {
  const result = await detectDuplicate(s.issue, s.openIssues);
  return {
    issueEmbedding:    result.issueEmbedding,
    similarityScore:   result.similarityScore,
    isDuplicate:       result.isDuplicate,
    duplicateOfNumber: result.duplicateOfNumber,
  };
};

const markDuplicate = async (s) => {
  await GitHub.markDuplicate(s.issue.owner, s.issue.repoName, s.issue.number, s.duplicateOfNumber);
  return {};
};

const reasonWithLLM = async (s) => {
  const llmAnalysis = await runTriageAgent(s.issue.title, s.issue.body);
  return { llmAnalysis, burnoutRisk: llmAnalysis.burnoutRisk };
};

const runLabelPrediction = async (s) => {
  const result = await predictLabels(s.llmAnalysis);
  return { predictedLabels: result.labels, predictedPriority: result.priority };
};

const updateGitHub = async (s) => {
  const { owner, repoName, number } = s.issue;
  const logs = [];

  if (s.isDuplicate) {
    const ok = await GitHub.applyLabels(owner, repoName, number, ['duplicate']);
    logs.push(`Applied [duplicate]: ${ok ? 'ok' : 'failed'}`);
  } else {
    if (s.predictedLabels && s.predictedLabels.length > 0) {
      const ok = await GitHub.applyLabels(owner, repoName, number, s.predictedLabels);
      logs.push(`Applied labels [${s.predictedLabels.join(', ')}]: ${ok ? 'ok' : 'failed'}`);
    }
    if (s.burnoutRisk) {
      const ok = await GitHub.postComment(owner, repoName, number,
        'Thanks for opening this issue!\n\nOur maintainers are volunteers — please be kind and patient. We appreciate it!',
      );
      logs.push(`Posted burnout-risk comment: ${ok ? 'ok' : 'failed'}`);
    }
  }

  return { executionLogs: logs };
};

const saveResults = async (s) => {
  logger.info(
    `Triage done: ${s.issue.owner}/${s.issue.repoName}#${s.issue.number} ` +
    `isDuplicate=${s.isDuplicate} labels=[${s.predictedLabels?.join(', ') ?? ''}]`,
  );
  return {};
};

const sendReportNode = async (s) => {
  const reported = await sendReport({
    issue:             s.issue,
    isDuplicate:       s.isDuplicate       ?? false,
    duplicateOfNumber: s.duplicateOfNumber ?? null,
    analysis:          s.llmAnalysis       ?? null,
    predictedLabels:   s.predictedLabels   ?? [],
    predictedPriority: s.predictedPriority ?? 'low',
    executionLogs:     s.executionLogs     ?? [],
    triageCompletedAt: new Date().toISOString(),
  });
  return { reported };
};

// ── Graph ─────────────────────────────────────────────────────────────────────

const workflow = new StateGraph(State)
  .addNode('receiveIssue',      receiveIssue)
  .addNode('fetchRepoContext',  fetchRepoContext)
  .addNode('fetchOpenIssues',   fetchOpenIssues)
  .addNode('runDuplicateCheck', runDuplicateCheck)
  .addNode('markDuplicate',     markDuplicate)
  .addNode('reasonWithLLM',     reasonWithLLM)
  .addNode('runLabelPrediction',runLabelPrediction)
  .addNode('updateGitHub',      updateGitHub)
  .addNode('saveResults',       saveResults)
  .addNode('sendReport',        sendReportNode)

  .addEdge(START,                 'receiveIssue')
  .addEdge('receiveIssue',        'fetchRepoContext')
  .addEdge('fetchRepoContext',    'fetchOpenIssues')
  .addEdge('fetchOpenIssues',     'runDuplicateCheck')

  // Branch: duplicate → markDuplicate, not duplicate → reasonWithLLM
  .addConditionalEdges('runDuplicateCheck', (s) => s.isDuplicate ? 'markDuplicate' : 'reasonWithLLM', {
    markDuplicate: 'markDuplicate',
    reasonWithLLM: 'reasonWithLLM',
  })

  .addEdge('markDuplicate',      'updateGitHub')      // duplicate path
  .addEdge('reasonWithLLM',      'runLabelPrediction') // non-duplicate path
  .addEdge('runLabelPrediction', 'updateGitHub')

  .addEdge('updateGitHub',  'saveResults')
  .addEdge('saveResults',   'sendReport')
  .addEdge('sendReport',    END);

export const issueTriageWorkflow = workflow.compile({ checkpointer: triageMemory });

// ── Entry point ───────────────────────────────────────────────────────────────

export async function runWorkflow(issue) {
  const config = { configurable: { thread_id: `triage-${issue.issueId}` } };
  logger.info(`Workflow started: thread=${config.configurable.thread_id}`);
  const finalState = await issueTriageWorkflow.invoke({ issue }, config);
  logger.info(`Workflow complete: thread=${config.configurable.thread_id}`);
  return finalState;
}
