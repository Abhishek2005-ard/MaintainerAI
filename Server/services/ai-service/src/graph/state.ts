import { Annotation } from '@langchain/langgraph';
import type { IssuePayload, IssueAnalysis } from '../types/index.js';

// Shared state object that flows through every node in the triage graph
export const TriageState = Annotation.Root({
  issue: Annotation<IssuePayload>(),
  analysis: Annotation<IssueAnalysis>(),
  actions: Annotation<string[]>(),       // e.g. ["add_label:bug", "post_support_comment"]
  executionLogs: Annotation<string[]>(), // result of each action execution
});
