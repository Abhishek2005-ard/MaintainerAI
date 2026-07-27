import { notifyReportService } from '../tools/reportTools.js';
import type { TriageReport } from '../tools/reportTools.js';

// Sends the completed triage report to the report-service.
// Returns true if the report was accepted, false otherwise.
export function sendReport(report: TriageReport): Promise<boolean> {
  return notifyReportService(report);
}
