import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createTriageReport,
  getDashboardStats,
  getReports,
  getWeeklyDigest,
} from '../controllers/ReportController.js';

const router = express.Router();

// Internal (M2M) — requires a signed JWT from the AI service
router.post('/reports/triage', authMiddleware, createTriageReport);

// Public read endpoints
router.get('/reports',           getReports);
router.get('/reports/dashboard', getDashboardStats);
router.get('/reports/digest',    getWeeklyDigest);

export default router;
