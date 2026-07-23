import express from 'express';
import { handleWebhook } from '../controllers/TriageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint from GitHub microservice
router.post('/webhook', authMiddleware, handleWebhook);

export default router;
