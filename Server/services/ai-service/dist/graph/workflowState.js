import { Annotation } from '@langchain/langgraph';
// Shared state object that flows through every node in the IssueTriageWorkflow.
// Each node receives this state and returns a partial update.
export const IssueTriageState = Annotation.Root({
    // --- Input (set before graph starts) ---
    issue: Annotation(),
    // --- Set by fetchRepoContextNode ---
    repoContext: Annotation(),
    // --- Set by fetchSimilarIssuesNode ---
    similarIssues: Annotation(),
    // --- Set by generateEmbeddingNode ---
    issueEmbedding: Annotation(),
    // --- Set by compareSimilarityNode ---
    similarityScore: Annotation(), // highest cosine score found (0–1)
    duplicateOfNumber: Annotation(), // issue number of the closest match
    isDuplicate: Annotation(), // true if score ≥ DUPLICATE_THRESHOLD
    // --- Set by reasonWithLLMNode (non-duplicate path only) ---
    llmAnalysis: Annotation(),
    burnoutRisk: Annotation(),
    // --- Set by predictLabelsNode (non-duplicate path only) ---
    predictedLabels: Annotation(),
    predictedPriority: Annotation(),
    // --- Set by updateGitHubNode ---
    executionLogs: Annotation(),
    // --- Set by notifyReportServiceNode ---
    reported: Annotation(),
});
