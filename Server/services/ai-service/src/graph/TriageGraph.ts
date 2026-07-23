import { StateGraph, START, END } from '@langchain/langgraph';
import { TriageState } from './state.js';
import { runTriageAgent } from '../agents/TriageAgent.js';
import * as githubTools from '../tools/githubTools.js';
import { triageMemory } from '../memory/triageMemory.js';
import { logger } from '../utils/logger.js';

// 1. Analyze Node: Uses LLM to categorize and analyze issue metadata
const analyzeNode = async (state: typeof TriageState.State) => {
  logger.info(`[Graph Node] Analyzing issue: ${state.issue.title}`);
  const analysis = await runTriageAgent(state.issue.title, state.issue.body);
  return { analysis };
};

// 2. Decide Node: Plans actions (labels, comments) based on analysis
const decideNode = async (state: typeof TriageState.State) => {
  logger.info(`[Graph Node] Deciding actions based on analysis category=${state.analysis.category}`);
  const actions: string[] = [];

  // Add category labels
  actions.push(`add_label:${state.analysis.category}`);
  actions.push(`add_label:priority-${state.analysis.priority}`);

  // If burnout risk is flagged, plan labels and supportive message
  if (state.analysis.burnoutRisk) {
    actions.push('add_label:burnout-risk');
    actions.push('post_support_comment');
  }

  return { actions };
};

// 3. Execute Node: Carries out the actions via GitHub microservice tools
const executeNode = async (state: typeof TriageState.State) => {
  logger.info(`[Graph Node] Executing actions: ${state.actions.join(', ')}`);
  const logs: string[] = [];
  const { owner, repoName, number } = state.issue;

  const labelsToAdd: string[] = [];
  let shouldPostComment = false;

  for (const action of state.actions) {
    if (action.startsWith('add_label:')) {
      const label = action.split(':')[1];
      labelsToAdd.push(label);
    } else if (action === 'post_support_comment') {
      shouldPostComment = true;
    }
  }

  // Execute label additions
  if (labelsToAdd.length > 0) {
    const success = await githubTools.addLabelsToIssue(owner, repoName, number, labelsToAdd);
    logs.push(`Added labels [${labelsToAdd.join(', ')}]: ${success ? 'success' : 'failed'}`);
  }

  // Execute supportive comment if burnout risk is high
  if (shouldPostComment) {
    const commentBody = `👋 Hello! Thanks for opening this issue. 

Our maintainers work hard to build and support this project. Please remember to respect healthy boundaries. We appreciate your patience while we review this issue! ❤️`;
    const success = await githubTools.postCommentToIssue(owner, repoName, number, commentBody);
    logs.push(`Posted supportive comment: ${success ? 'success' : 'failed'}`);
  }

  return { executionLogs: logs };
};

// Assemble the StateGraph workflow
const workflow = new StateGraph(TriageState)
  .addNode('analyze', analyzeNode)
  .addNode('decide', decideNode)
  .addNode('execute', executeNode)
  .addEdge(START, 'analyze')
  .addEdge('analyze', 'decide')
  .addEdge('decide', 'execute')
  .addEdge('execute', END);

// Compile the graph with memory savers
export const triageGraph = workflow.compile({
  checkpointer: triageMemory
});

/**
 * Runs the complete LangGraph triage flow for a given issue
 */
export const runTriageFlow = async (issue: any) => {
  // Use the issue id as a thread id for persistence memory grouping
  const config = {
    configurable: { thread_id: `thread-${issue.issueId}` }
  };

  logger.info(`Invoking TriageGraph flow for issue thread ID: ${config.configurable.thread_id}`);
  
  const finalState = await triageGraph.invoke({ issue }, config);
  return finalState;
};
