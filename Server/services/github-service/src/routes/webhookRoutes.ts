import express from 'express';
import { webhookController } from '../controllers/WebhookController.js';

const router = express.Router();

// Route specifically for incoming GitHub webhook payloads
router.post('/', webhookController.verifySignature, webhookController.handleWebhook);

export default router;
