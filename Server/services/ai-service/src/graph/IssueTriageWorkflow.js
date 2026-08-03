import { StateGraph, START, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { getMongoCheckpointer } from '../memory/mongoCheckpointer.js';
import { runTriageAgent } from '../agents/TriageAgent.js';
import { predictLabels } from '../agents/LabelAgent.js';
import { detectDuplicate } from '../agents/DuplicateAgent.js';
import * as GitHub from '../agents/GitHubAgent.js';
import { sendReport } from '../agents/ReportAgent.js';
import { logger } from '../utils/logger.js';

// Define workflow state schema
const State = Annotation.Root({
  issue:             Annotation(),
  triageRules:       Annotation(),
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

// Workflow step handlers
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
  const customHints = s.triageRules?.customPromptHints || null;
  const llmAnalysis = await runTriageAgent(s.issue.title, s.issue.body, customHints);
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
    const ok1 = await GitHub.applyLabels(owner, repoName, number, ['duplicate']);
    logs.push(`Applied [duplicate] label: ${ok1 ? 'ok' : 'failed'}`);
    const ok2 = await GitHub.closeIssue(owner, repoName, number);
    logs.push(`Closed duplicate issue on GitHub: ${ok2 ? 'ok' : 'failed'}`);
  } else {
    if (s.predictedLabels && s.predictedLabels.length > 0) {
      const ok = await GitHub.applyLabels(owner, repoName, number, s.predictedLabels);
      logs.push(`Applied labels [${s.predictedLabels.join(', ')}]: ${ok ? 'ok' : 'failed'}`);
    }

    const ok = await GitHub.postTriageComment(
      owner, repoName, number,
      s.llmAnalysis,
      s.predictedLabels ?? [],
      s.predictedPriority ?? 'low',
    );
    logs.push(`Posted triage summary comment: ${ok ? 'ok' : 'failed'}`);

    if (s.burnoutRisk) {
      const ok2 = await GitHub.postComment(owner, repoName, number,
        'Hi there! Thanks for opening this issue. Our team will review this shortly. We appreciate your patience!',
      );
      logs.push(`Posted maintainer greeting: ${ok2 ? 'ok' : 'failed'}`);
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

// Build LangGraph state workflow
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

  .addConditionalEdges('runDuplicateCheck', (s) => s.isDuplicate ? 'markDuplicate' : 'reasonWithLLM', {
    markDuplicate: 'markDuplicate',
    reasonWithLLM: 'reasonWithLLM',
  })

  .addEdge('markDuplicate',      'updateGitHub')
  .addEdge('reasonWithLLM',      'runLabelPrediction')
  .addEdge('runLabelPrediction', 'updateGitHub')

  .addEdge('updateGitHub',  'saveResults')
  .addEdge('saveResults',   'sendReport')
  .addEdge('sendReport',    END);

// Compile graph with Mongo or memory state checkpointer
let _compiledWorkflow = null;

async function getCompiledWorkflow() {
  if (_compiledWorkflow) return _compiledWorkflow;
  const mongoCheckpointer = await getMongoCheckpointer();
  const checkpointer = mongoCheckpointer ?? new MemorySaver();
  if (!mongoCheckpointer) {
    logger.warn('[Workflow] Using in-memory MemorySaver — state will not survive restarts.');
  }
  _compiledWorkflow = workflow.compile({ checkpointer });
  return _compiledWorkflow;
}

// Execute the triage workflow
export async function runWorkflow(issue, triageRules = null) {
  const compiled = await getCompiledWorkflow();
  const config = { configurable: { thread_id: `triage-${issue.issueId}` } };
  logger.info(`Workflow started: thread=${config.configurable.thread_id}`);
  const finalState = await compiled.invoke({ issue, triageRules }, config);
  logger.info(`Workflow complete: thread=${config.configurable.thread_id}`);
  return finalState;
}
