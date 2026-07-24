import { Annotation } from '@langchain/langgraph';
import type { IssuePayload, RepoContext, SimilarIssue, IssueAnalysis } from '../types/index.js';

// Shared state object that flows through every node in the IssueTriageWorkflow.
// Each node receives this state and returns a partial update.
export const IssueTriageState = Annotation.Root({

  // --- Input (set before graph starts) ---

  issue: Annotation<IssuePayload>(),

  // --- Set by fetchRepoContextNode ---

  repoContext: Annotation<RepoContext | null>(),

  // --- Set by fetchSimilarIssuesNode ---

  similarIssues: Annotation<SimilarIssue[]>(),

  // --- Set by generateEmbeddingNode ---

  issueEmbedding: Annotation<number[]>(),

  // --- Set by compareSimilarityNode ---

  similarityScore: Annotation<number>(),            // highest cosine score found (0–1)
  duplicateOfNumber: Annotation<number | null>(),   // issue number of the closest match
  isDuplicate: Annotation<boolean>(),               // true if score ≥ DUPLICATE_THRESHOLD

  // --- Set by reasonWithLLMNode (non-duplicate path only) ---

  llmAnalysis: Annotation<IssueAnalysis | null>(),
  burnoutRisk: Annotation<boolean>(),

  // --- Set by predictLabelsNode (non-duplicate path only) ---

  predictedLabels: Annotation<string[]>(),
  predictedPriority: Annotation<string>(),

  // --- Set by updateGitHubNode ---

  executionLogs: Annotation<string[]>(),

  // --- Set by notifyReportServiceNode ---

  reported: Annotation<boolean>(),

});
