// Shared types used across the entire ai-service

// ---- Input ----------------------------------------------------------------

export interface IssuePayload {
  issueId: string;
  number: number;
  title: string;
  body: string;
  author: string;
  owner: string;
  repoName: string;
}

// ---- Repository Context ---------------------------------------------------

// Basic repo info fetched from the github-service at the start of triage
export interface RepoContext {
  name: string;
  fullName: string;
  owner: string;
  description: string;
  triageRulesActive: boolean;
}

// ---- Similar Issues -------------------------------------------------------

// Shape of a past issue used during duplicate detection
export interface SimilarIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
}

// ---- LLM Analysis ---------------------------------------------------------

export interface IssueAnalysis {
  category: 'bug' | 'feature' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  burnoutRisk: boolean;
  reasoning: string;
}

// ---- Workflow Result -------------------------------------------------------

// Final result returned by TriageService to the controller
export interface TriageResult {
  isDuplicate: boolean;
  duplicateOfNumber: number | null;
  analysis: IssueAnalysis | null;
  predictedLabels: string[];
  predictedPriority: string;
  executionLogs: string[];
  reported: boolean;
}
