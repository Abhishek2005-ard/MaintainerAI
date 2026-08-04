import { ReportModel } from '../models/ReportModel.js';
import { logger } from '../utils/logger.js';
import { isConnected } from '../config/db.js';
import { getCache, setCache, clearPattern } from '../../../shared/redisClient.js';

/**
 * Checks if the MongoDB connection is active and returns a service unavailable error if disconnected.
 */
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

/**
 * Converts a Mongo aggregate array into a plain key-to-count key-value map.
 */
function toBreakdown(rows, fallback) {
  return rows.reduce((acc, row) => {
    acc[row._id ?? fallback] = row.count;
    return acc;
  }, {});
}

/**
 * Calculates a past date relative to the current timestamp.
 */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Saves a new issue triage report sent by the artificial intelligence processing service.
 */
export const createTriageReport = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const report = new ReportModel(req.body);
    await report.save();

    logger.info(
      `Report saved: issue #${report.issue?.number} (${report.issue?.owner}/${report.issue?.repoName})`,
    );

    await clearPattern('reports:*');

    res.status(201).json({ success: true, id: report._id });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves stored triage reports matching optional filters such as owner, repository, or duplicate status.
 */
export const getReports = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repoName, isDuplicate, number } = req.query;

    const cacheKey = `reports:list:${owner || 'all'}:${repoName || 'all'}:${isDuplicate || 'all'}:${number || 'all'}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, count: cached.length, reports: cached });
    }

    const filter = {};
    if (owner)       filter['issue.owner']    = owner;
    if (repoName)    filter['issue.repoName'] = repoName;
    if (isDuplicate) filter.isDuplicate       = isDuplicate === 'true';
    if (number)      filter['issue.number']   = parseInt(number, 10);

    const reports = await ReportModel.find(filter).sort({ triageCompletedAt: -1 }).limit(100);

    await setCache(cacheKey, reports, 300);

    res.json({ success: true, cached: false, count: reports.length, reports });
  } catch (err) {
    next(err);
  }
};

/**
 * Aggregates analytical statistics across stored issue triage reports for dashboard displays.
 */
export const getDashboardStats = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repoName } = req.query;
    const cacheKey = `reports:dashboard:${owner || 'all'}:${repoName || 'all'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, stats: cached });
    }

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

    const stats = {
      totalIssues:       total,
      duplicates,
      burnoutRisk,
      categoryBreakdown: toBreakdown(categories, 'unknown'),
      priorityBreakdown: toBreakdown(priorities, 'low'),
    };

    await setCache(cacheKey, stats, 300);

    res.json({
      success: true,
      cached: false,
      stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generates a summary report of issues triaged over the past seven days.
 */
export const getWeeklyDigest = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const cacheKey = 'reports:weekly_digest';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, digest: cached });
    }

    const reports = await ReportModel.find({ triageCompletedAt: { $gte: daysAgo(7) } });

    const categoryCounts = {};
    const priorityCounts = {};

    for (const report of reports) {
      const cat  = report.analysis?.category    || 'unknown';
      const prio = report.predictedPriority || 'low';
      categoryCounts[cat]  = (categoryCounts[cat]  || 0) + 1;
      priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
    }

    const digest = {
      period:            'last-7-days',
      totalTriaged:      reports.length,
      duplicates:        reports.filter(r => r.isDuplicate).length,
      burnoutRisk:       reports.filter(r => r.analysis?.burnoutRisk).length,
      categoryBreakdown: categoryCounts,
      priorityBreakdown: priorityCounts,
      generatedAt:       new Date().toISOString(),
    };

    await setCache(cacheKey, digest, 600);

    res.json({
      success: true,
      cached: false,
      digest,
    });
  } catch (err) {
    next(err);
  }
};

