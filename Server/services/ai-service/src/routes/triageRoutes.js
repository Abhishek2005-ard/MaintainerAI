import express from 'express';
import { handleWebhook, getJobStatus } from '../controllers/TriageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protected — only authorized services/gateway can call
router.post('/webhook', authMiddleware, handleWebhook);
router.get('/job/:jobId', authMiddleware, getJobStatus);

export default router;
