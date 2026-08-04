import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createTriageReport,
  getDashboardStats,
  getReports,
  getWeeklyDigest,
} from '../controllers/ReportController.js';

const router = express.Router();

router.post('/reports/triage', authMiddleware, createTriageReport);

router.get('/reports',           getReports);
router.get('/reports/dashboard', getDashboardStats);
router.get('/reports/digest',    getWeeklyDigest);

export default router;

