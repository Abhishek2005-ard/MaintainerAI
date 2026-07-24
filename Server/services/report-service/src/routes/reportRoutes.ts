import express from 'express';
import { createTriageReport, getReports, getDashboardStats, getWeeklyDigest } from '../controllers/ReportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// M2M endpoint — requires JWT from agent-service
router.post('/reports/triage', authMiddleware, createTriageReport);

// Dashboard and Reporting APIs
router.get('/reports', getReports);
router.get('/reports/dashboard', getDashboardStats);
router.get('/reports/digest', getWeeklyDigest);

export default router;
