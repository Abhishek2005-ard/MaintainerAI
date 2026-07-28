import { env } from '../config/env.js';
import { internalRequest } from '../utils/httpClient.js';
import { logger } from '../utils/logger.js';

export const notifyReportService = async (report) => {
  const url = `${env.REPORT_SERVICE_URL}/reports/triage`;
  logger.info(`[Tool:reportService] Sending triage report for issue #${report.issue.number}`);

  try {
    const res = await internalRequest(url, {
      method: 'POST',
      body: JSON.stringify(report),
    });
    return res.ok;
  } catch (err) {
    logger.warn(`[Tool:reportService] Could not reach report service: ${err.message}. Continuing.`);
    return false;
  }
};
