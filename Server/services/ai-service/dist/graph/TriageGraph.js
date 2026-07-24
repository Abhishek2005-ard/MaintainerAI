import { StateGraph, START, END } from '@langchain/langgraph';
import { TriageState } from './state.js';
import { runTriageAgent } from '../agents/TriageAgent.js';
import * as githubTools from '../tools/githubTools.js';
import { triageMemory } from '../memory/triageMemory.js';
import { logger } from '../utils/logger.js';
// Node 1 — send issue to LLM and get back structured analysis
const analyzeIssueNode = async (state) => {
    logger.info(`[Graph:analyze] Analyzing: "${state.issue.title}"`);
    const analysis = await runTriageAgent(state.issue.title, state.issue.body);
    return { analysis };
};
// Node 2 — convert analysis into a list of action strings
const decideActionsNode = async (state) => {
    const { category, priority, burnoutRisk } = state.analysis;
    logger.info(`[Graph:decide] category=${category}, priority=${priority}, burnoutRisk=${burnoutRisk}`);
    const actions = [];
    actions.push(`add_label:${category}`);
    actions.push(`add_label:priority-${priority}`);
    if (burnoutRisk) {
        actions.push('add_label:burnout-risk');
        actions.push('post_support_comment');
    }
    return { actions };
};
// Node 3 — execute each action via the GitHub microservice tools
const executeActionsNode = async (state) => {
    const { owner, repoName, number } = state.issue;
    logger.info(`[Graph:execute] Running ${state.actions.length} action(s) on ${owner}/${repoName}#${number}`);
    const logs = [];
    const labelsToAdd = [];
    let shouldPostComment = false;
    for (const action of state.actions) {
        if (action.startsWith('add_label:')) {
            labelsToAdd.push(action.split(':')[1]);
        }
        else if (action === 'post_support_comment') {
            shouldPostComment = true;
        }
    }
    if (labelsToAdd.length > 0) {
        const ok = await githubTools.addLabelsToIssue(owner, repoName, number, labelsToAdd);
        logs.push(`Added labels [${labelsToAdd.join(', ')}]: ${ok ? 'success' : 'failed'}`);
    }
    if (shouldPostComment) {
        const commentBody = [
            'Thanks for opening this issue!',
            '',
            'Our maintainers are volunteers — please be kind and patient. We appreciate it!',
        ].join('\n');
        const ok = await githubTools.postCommentToIssue(owner, repoName, number, commentBody);
        logs.push(`Posted support comment: ${ok ? 'success' : 'failed'}`);
    }
    return { executionLogs: logs };
};
// Wire up the 3 nodes and compile the graph with memory checkpointing
const workflow = new StateGraph(TriageState)
    .addNode('analyze', analyzeIssueNode)
    .addNode('decide', decideActionsNode)
    .addNode('execute', executeActionsNode)
    .addEdge(START, 'analyze')
    .addEdge('analyze', 'decide')
    .addEdge('decide', 'execute')
    .addEdge('execute', END);
export const triageGraph = workflow.compile({ checkpointer: triageMemory });
// Entry point for running the full triage flow — each issue gets its own thread
export const runTriageFlow = async (issue) => {
    const config = { configurable: { thread_id: `triage-${issue.issueId}` } };
    logger.info(`[TriageGraph] Starting flow for thread: ${config.configurable.thread_id}`);
    return await triageGraph.invoke({ issue }, config);
};
