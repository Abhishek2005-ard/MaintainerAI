import { Annotation } from '@langchain/langgraph';
// Shared state object that flows through every node in the triage graph
export const TriageState = Annotation.Root({
    issue: Annotation(),
    analysis: Annotation(),
    actions: Annotation(), // e.g. ["add_label:bug", "post_support_comment"]
    executionLogs: Annotation(), // result of each action execution
});
