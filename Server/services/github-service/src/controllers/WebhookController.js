import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import * as webhookService from '../services/WebhookService.js';

// Verify webhook signature header
export const verifySignature = (req, res, next) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      throw new ApiError(401, 'Signature header missing.');
    }

    const hmac = crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET);
    const bodyStr = JSON.stringify(req.body);
    const digest = 'sha256=' + hmac.update(bodyStr).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      logger.warn('Received webhook with invalid signature.');
      throw new ApiError(401, 'Signature mismatch.');
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Handle incoming webhooks
export const handleWebhook = async (req, res, next) => {
  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    logger.info(`Received GitHub Webhook event: ${event}`);

    switch (event) {
      case 'installation':
        await webhookService.handleInstallationEvent(payload);
        break;
      case 'installation_repositories':
        await webhookService.handleInstallationReposEvent(payload);
        break;
      case 'issues':
        await webhookService.handleIssueEvent(payload);
        break;
      default:
        logger.info(`Ignored webhook event: ${event}`);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
