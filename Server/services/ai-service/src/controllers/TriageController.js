import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { runTriage } from '../services/TriageService.js';
import { triageQueue } from '../queue/triageQueue.js';

// Receives forwarded webhook from github-service and kicks off / enqueues the triage workflow
export const handleWebhook = async (req, res, next) => {
  try {
    const { action, issue, repository, triageRules, asyncMode } = req.body;

    if (!action || !issue || !repository) {
      throw new ApiError(400, 'Request body must include "action", "issue", and "repository".');
    }

    logger.info(`[TriageController] ${repository.fullName}#${issue.number} (action: "${action}")`);

    // Add job to BullMQ queue
    let job;
    try {
      job = await triageQueue.add('process-triage', {
        action,
        issue,
        repository,
        triageRules: triageRules ?? null,
      });
      logger.info(`[TriageController] Enqueued job #${job.id} into BullMQ`);
    } catch (queueErr) {
      logger.warn(`[TriageController] BullMQ enqueueing failed (${queueErr.message}), falling back to direct execution.`);
    }

    // If explicit async mode requested, respond with jobId immediately
    if (asyncMode && job) {
      return res.status(202).json({
        success: true,
        queued: true,
        jobId: job.id,
        message: 'Triage task enqueued successfully.',
      });
    }

    // If job was added to queue, wait for worker completion (or fallback to runTriage directly)
    let result;
    if (job) {
      result = await job.waitUntilFinished(triageQueue.token, 120000);
    } else {
      result = await runTriage(issue, triageRules ?? null);
    }

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
  } catch (err) {
    next(err);
  }
};

// Endpoint to check status of background triage job
export const getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await triageQueue.getJob(jobId);

    if (!job) {
      throw new ApiError(404, `Job #${jobId} not found.`);
    }

    const state = await job.getState();
    const isCompleted = state === 'completed';
    const isFailed = state === 'failed';

    res.status(200).json({
      success: true,
      jobId: job.id,
      state,
      progress: job.progress,
      failedReason: job.failedReason || null,
      result: isCompleted ? job.returnvalue : null,
    });
  } catch (err) {
    next(err);
  }
};
