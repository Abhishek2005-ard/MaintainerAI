import { Request, Response } from 'express';
import { ReportModel } from '../models/ReportModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logger } from '../utils/logger.js';

// POST /reports/triage
export const createTriageReport = catchAsync(async (req: Request, res: Response) => {
  const report = new ReportModel(req.body);
  await report.save();
  logger.info(`Saved report for issue #${report.issue?.number} (${report.issue?.owner}/${report.issue?.repoName})`);
  res.status(201).json({ success: true, id: report._id });
});

// GET /reports
export const getReports = catchAsync(async (req: Request, res: Response) => {
  const { owner, repoName, isDuplicate } = req.query;
  const filter: any = {};
  if (owner) filter['issue.owner'] = owner;
  if (repoName) filter['issue.repoName'] = repoName;
  if (isDuplicate) filter.isDuplicate = isDuplicate === 'true';

  const reports = await ReportModel.find(filter).sort({ triageCompletedAt: -1 }).limit(100);
  res.json({ success: true, count: reports.length, reports });
});

// GET /reports/dashboard
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const total = await ReportModel.countDocuments();
  const duplicates = await ReportModel.countDocuments({ isDuplicate: true });
  const burnoutRisk = await ReportModel.countDocuments({ 'analysis.burnoutRisk': true });

  const categories = await ReportModel.aggregate([
    { $group: { _id: '$analysis.category', count: { $sum: 1 } } }
  ]);
  const priorities = await ReportModel.aggregate([
    { $group: { _id: '$predictedPriority', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    stats: {
      totalIssues: total,
      duplicates,
      burnoutRisk,
      categoryBreakdown: categories.reduce((acc, c) => ({ ...acc, [c._id || 'unknown']: c.count }), {}),
      priorityBreakdown: priorities.reduce((acc, p) => ({ ...acc, [p._id || 'low']: p.count }), {}),
    }
  });
});

// GET /reports/digest
export const getWeeklyDigest = catchAsync(async (req: Request, res: Response) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const reports = await ReportModel.find({ triageCompletedAt: { $gte: sevenDaysAgo } });

  const total = reports.length;
  const duplicates = reports.filter(r => r.isDuplicate).length;
  const burnoutRisk = reports.filter(r => r.analysis?.burnoutRisk).length;
  
  const categoryCounts: any = {};
  const priorityCounts: any = {};
  
  reports.forEach(r => {
    const cat = r.analysis?.category || 'unknown';
    const prio = r.predictedPriority || 'low';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
  });

  res.json({
    success: true,
    digest: {
      period: 'Weekly',
      totalTriaged: total,
      duplicates,
      burnoutRisk,
      categoryBreakdown: categoryCounts,
      priorityBreakdown: priorityCounts,
      generatedAt: new Date().toISOString(),
    }
  });
});
