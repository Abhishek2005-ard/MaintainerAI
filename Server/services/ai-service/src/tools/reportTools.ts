import { env } from '../config/env.js';
import { internalRequest } from '../utils/httpClient.js';
import { logger } from '../utils/logger.js';
import type { IssuePayload, IssueAnalysis } from '../types/index.js';

export interface TriageReport {
  issue: IssuePayload;
  isDuplicate: boolean;
  duplicateOfNumber: number | null;
  analysis: IssueAnalysis | null;
  predictedLabels: string[];
  predictedPriority: string;
  executionLogs: string[];
  triageCompletedAt: string;
}

export const notifyReportService = async (report: TriageReport): Promise<boolean> => {
  const url = `${env.REPORT_SERVICE_URL}/reports/triage`;
  logger.info(`[Tool:reportService] Sending triage report for issue #${report.issue.number}`);

  try {
    const res = await internalRequest(url, {
      method: 'POST',
      body: JSON.stringify(report),
    });
    return res.ok;
  } catch (err: any) {
    logger.warn(`[Tool:reportService] Could not reach report service: ${err.message}. Continuing.`);
    return false;
  }
};
