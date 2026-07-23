import { runTriageFlow } from '../graph/TriageGraph.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
// POST /webhook - Receives forwarded webhook payload from GitHub microservice
export const handleWebhook = catchAsync(async (req, res, next) => {
    const { action, issue, repository } = req.body;
    if (!issue || !action || !repository) {
        throw new ApiError(400, 'Payload must contain action, issue, and repository.');
    }
    logger.info(`Received forwarded issue webhook: ${repository.fullName}#${issue.number} (action: ${action})`);
    // Invoke LangGraph to orchestrate AI reasoning
    const result = await runTriageFlow(issue);
    res.json({
        success: true,
        message: 'Triage Graph completed successfully',
        analysis: result.analysis,
        actions: result.actions,
        executionLogs: result.executionLogs
    });
});
