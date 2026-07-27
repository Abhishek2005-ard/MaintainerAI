import { Request, Response } from 'express';
import { ReportModel } from '../models/ReportModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logger } from '../utils/logger.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportFilter {
  'issue.owner'?:    unknown;
  'issue.repoName'?: unknown;
  isDuplicate?:      boolean;
}

interface CountBreakdown {
  [key: string]: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a Mongo aggregate [ { _id, count } ] array into a plain key→count object. */
function toBreakdown(rows: { _id: string | null; count: number }[], fallback: string): CountBreakdown {
  return rows.reduce<CountBreakdown>((acc, row) => {
    acc[row._id ?? fallback] = row.count;
    return acc;
  }, {});
}

/** Returns a Date that is `days` days before now. */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/** POST /reports/triage — Save a triage report sent by the AI service. */
export const createTriageReport = catchAsync(async (req: Request, res: Response) => {
  const report = new ReportModel(req.body);
  await report.save();

  logger.info(
    `Report saved: issue #${report.issue?.number} (${report.issue?.owner}/${report.issue?.repoName})`,
  );

  res.status(201).json({ success: true, id: report._id });
});

/** GET /reports — List reports, optionally filtered by owner, repoName, or isDuplicate. */
export const getReports = catchAsync(async (req: Request, res: Response) => {
  const { owner, repoName, isDuplicate } = req.query;

  const filter: ReportFilter = {};
  if (owner)       filter['issue.owner']    = owner;
  if (repoName)    filter['issue.repoName'] = repoName;
  if (isDuplicate) filter.isDuplicate       = isDuplicate === 'true';

  const reports = await ReportModel.find(filter).sort({ triageCompletedAt: -1 }).limit(100);

  res.json({ success: true, count: reports.length, reports });
});

/** GET /reports/dashboard — Aggregate stats across all stored reports. */
export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [total, duplicates, burnoutRisk, categories, priorities] = await Promise.all([
    ReportModel.countDocuments(),
    ReportModel.countDocuments({ isDuplicate: true }),
    ReportModel.countDocuments({ 'analysis.burnoutRisk': true }),
    ReportModel.aggregate<{ _id: string | null; count: number }>([
      { $group: { _id: '$analysis.category', count: { $sum: 1 } } },
    ]),
    ReportModel.aggregate<{ _id: string | null; count: number }>([
      { $group: { _id: '$predictedPriority', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalIssues:       total,
      duplicates,
      burnoutRisk,
      categoryBreakdown: toBreakdown(categories, 'unknown'),
      priorityBreakdown: toBreakdown(priorities, 'low'),
    },
  });
});

/** GET /reports/digest — Summary of reports triaged in the last 7 days. */
export const getWeeklyDigest = catchAsync(async (_req: Request, res: Response) => {
  const reports = await ReportModel.find({ triageCompletedAt: { $gte: daysAgo(7) } });

  const categoryCounts: CountBreakdown = {};
  const priorityCounts: CountBreakdown = {};

  for (const report of reports) {
    const cat  = report.analysis?.category    || 'unknown';
    const prio = report.predictedPriority || 'low';
    categoryCounts[cat]  = (categoryCounts[cat]  || 0) + 1;
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
  }

  res.json({
    success: true,
    digest: {
      period:            'last-7-days',
      totalTriaged:      reports.length,
      duplicates:        reports.filter(r => r.isDuplicate).length,
      burnoutRisk:       reports.filter(r => r.analysis?.burnoutRisk).length,
      categoryBreakdown: categoryCounts,
      priorityBreakdown: priorityCounts,
      generatedAt:       new Date().toISOString(),
    },
  });
});
