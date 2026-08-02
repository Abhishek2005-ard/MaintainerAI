import { ReportModel } from '../models/ReportModel.js';
import { logger } from '../utils/logger.js';
import { isConnected } from '../config/db.js';

// ─── DB guard ─────────────────────────────────────────────────────────────────

/** Call at the top of any controller that needs MongoDB.
 *  Returns true if MongoDB is NOT ready (caller should return immediately). */
function dbNotReady(res) {
  if (!isConnected()) {
    res.status(503).json({
      error: 'Database unavailable — MongoDB Atlas is not connected. '
           + 'Check your REPORT_MONGO_URI and ensure your IP is whitelisted in Atlas.',
    });
    return true;
  }
  return false;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a Mongo aggregate [ { _id, count } ] array into a plain key→count object. */
function toBreakdown(rows, fallback) {
  return rows.reduce((acc, row) => {
    acc[row._id ?? fallback] = row.count;
    return acc;
  }, {});
}

/** Returns a Date that is `days` days before now. */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/** POST /reports/triage — Save a triage report sent by the AI service. */
export const createTriageReport = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const report = new ReportModel(req.body);
    await report.save();

    logger.info(
      `Report saved: issue #${report.issue?.number} (${report.issue?.owner}/${report.issue?.repoName})`,
    );

    res.status(201).json({ success: true, id: report._id });
  } catch (err) {
    next(err);
  }
};

/** GET /reports — List reports, optionally filtered by owner, repoName, isDuplicate, or number. */
export const getReports = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repoName, isDuplicate, number } = req.query;

    const filter = {};
    if (owner)       filter['issue.owner']    = owner;
    if (repoName)    filter['issue.repoName'] = repoName;
    if (isDuplicate) filter.isDuplicate       = isDuplicate === 'true';
    if (number)      filter['issue.number']   = parseInt(number, 10);

    const reports = await ReportModel.find(filter).sort({ triageCompletedAt: -1 }).limit(100);

    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    next(err);
  }
};

/** GET /reports/dashboard — Aggregate stats across stored reports (supports optional owner & repoName filters). */
export const getDashboardStats = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repoName } = req.query;
    const filter = {};
    if (owner)    filter['issue.owner']    = owner;
    if (repoName) filter['issue.repoName'] = repoName;

    const [total, duplicates, burnoutRisk, categories, priorities] = await Promise.all([
      ReportModel.countDocuments(filter),
      ReportModel.countDocuments({ ...filter, isDuplicate: true }),
      ReportModel.countDocuments({ ...filter, 'analysis.burnoutRisk': true }),
      ReportModel.aggregate([
        { $match: filter },
        { $group: { _id: '$analysis.category', count: { $sum: 1 } } },
      ]),
      ReportModel.aggregate([
        { $match: filter },
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
  } catch (err) {
    next(err);
  }
};

/** GET /reports/digest — Summary of reports triaged in the last 7 days. */
export const getWeeklyDigest = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const reports = await ReportModel.find({ triageCompletedAt: { $gte: daysAgo(7) } });

    const categoryCounts = {};
    const priorityCounts = {};

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
  } catch (err) {
    next(err);
  }
};
