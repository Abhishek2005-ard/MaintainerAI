import { Annotation } from '@langchain/langgraph';

export interface IssueAnalysis {
  category: 'bug' | 'feature' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  burnoutRisk: boolean;
  reasoning: string;
}

export const TriageState = Annotation.Root({
  // The raw issue details received from GitHub Webhook
  issue: Annotation<any>(),
  // The output of LLM analysis
  analysis: Annotation<IssueAnalysis>(),
  // The actions planned based on the analysis (e.g. ['add_labels', 'post_comment'])
  actions: Annotation<string[]>(),
  // Execution logs for the actions performed
  executionLogs: Annotation<string[]>(),
});
