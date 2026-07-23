import { Annotation } from '@langchain/langgraph';
export const TriageState = Annotation.Root({
    // The raw issue details received from GitHub Webhook
    issue: Annotation(),
    // The output of LLM analysis
    analysis: Annotation(),
    // The actions planned based on the analysis (e.g. ['add_labels', 'post_comment'])
    actions: Annotation(),
    // Execution logs for the actions performed
    executionLogs: Annotation(),
});
