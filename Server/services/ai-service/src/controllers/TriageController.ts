import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { runTriage } from '../services/TriageService.js';
import type { IssuePayload } from '../types/index.js';

// Receives forwarded webhook from github-service and kicks off the triage workflow
export const handleWebhook = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { action, issue, repository } = req.body;

  if (!action || !issue || !repository) {
    throw new ApiError(400, 'Request body must include "action", "issue", and "repository".');
  }

  logger.info(`[TriageController] ${repository.fullName}#${issue.number} (action: "${action}")`);

  const result = await runTriage(issue as IssuePayload);

  res.status(200).json({
    success: true,
    message: 'Triage workflow completed successfully.',
    data: {
      isDuplicate:       result.isDuplicate,
      duplicateOfNumber: result.duplicateOfNumber,
      analysis:          result.analysis,
      predictedLabels:   result.predictedLabels,
      predictedPriority: result.predictedPriority,
      executionLogs:     result.executionLogs,
      reported:          result.reported,
    },
  });
});
