import { runWorkflow } from '../graph/IssueTriageWorkflow.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
// Validate the issue payload, run the full workflow, and return a clean typed result
export const runTriage = async (issue) => {
    const requiredFields = ['issueId', 'number', 'title', 'body', 'owner', 'repoName'];
    const missingFields = requiredFields.filter((field) => !issue[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Issue payload missing required fields: ${missingFields.join(', ')}`);
    }
    logger.info(`[TriageService] Triaging: "${issue.title}" (${issue.owner}/${issue.repoName}#${issue.number})`);
    const finalState = await runWorkflow(issue);
    return {
        isDuplicate: finalState.isDuplicate ?? false,
        duplicateOfNumber: finalState.duplicateOfNumber ?? null,
        analysis: finalState.llmAnalysis ?? null,
        predictedLabels: finalState.predictedLabels ?? [],
        predictedPriority: finalState.predictedPriority ?? 'low',
        executionLogs: finalState.executionLogs ?? [],
        reported: finalState.reported ?? false,
    };
};
