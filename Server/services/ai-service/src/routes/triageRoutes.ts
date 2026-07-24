import express from 'express';
import { handleWebhook } from '../controllers/TriageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protected — only the github-service can call this with a valid M2M JWT
router.post('/webhook', authMiddleware, handleWebhook);

export default router;
