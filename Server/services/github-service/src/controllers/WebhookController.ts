import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { InstallationModel } from '../models/InstallationModel.js';
import { RepositoryModel } from '../models/RepositoryModel.js';

export class WebhookController {
  // Verify webhook signature header
  public verifySignature(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      return res.status(401).json({ error: 'Signature header missing.' });
    }

    const hmac = crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET);
    const bodyStr = JSON.stringify(req.body);
    const digest = 'sha256=' + hmac.update(bodyStr).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      logger.warn('Received webhook with invalid signature.');
      return res.status(401).json({ error: 'Signature mismatch.' });
    }

    next();
  }

  // Handle incoming webhooks
  public async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const event = req.headers['x-github-event'] as string;
      const payload = req.body;

      logger.info(`Received GitHub Webhook event: ${event}`);

      switch (event) {
        case 'installation':
          await this.handleInstallationEvent(payload);
          break;
        case 'installation_repositories':
          await this.handleInstallationReposEvent(payload);
          break;
        case 'issues':
          await this.handleIssueEvent(payload);
          break;
        default:
          logger.info(`Ignored webhook event: ${event}`);
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }

  private async handleInstallationEvent(payload: any) {
    const action = payload.action;
    const instData = payload.installation;

    logger.info(`GitHub App Installation Action: ${action}`);

    if (action === 'created' || action === 'new_permissions_accepted') {
      await InstallationModel.findOneAndUpdate(
        { installationId: instData.id },
        {
          accountName: instData.account.login,
          accountId: instData.account.id,
          accountType: instData.account.type,
          avatarUrl: instData.account.avatar_url,
          permissions: instData.permissions,
          status: 'active'
        },
        { upsert: true, new: true }
      );
      logger.info(`Saved active installation id ${instData.id}.`);
    } else if (action === 'deleted') {
      await InstallationModel.deleteOne({ installationId: instData.id });
      await RepositoryModel.deleteMany({ installationId: instData.id });
      logger.info(`Deleted installation id ${instData.id}.`);
    } else if (action === 'suspend') {
      await InstallationModel.findOneAndUpdate(
        { installationId: instData.id },
        { status: 'suspended' }
      );
      logger.info(`Suspended installation id ${instData.id}.`);
    } else if (action === 'unsuspend') {
      await InstallationModel.findOneAndUpdate(
        { installationId: instData.id },
        { status: 'active' }
      );
      logger.info(`Un-suspended installation id ${instData.id}.`);
    }
  }

  private async handleInstallationReposEvent(payload: any) {
    const action = payload.action;
    const instId = payload.installation.id;

    if (action === 'added') {
      for (const repo of payload.repositories_added) {
        await RepositoryModel.findOneAndUpdate(
          { repoId: repo.id },
          {
            installationId: instId,
            name: repo.name,
            fullName: repo.full_name,
            owner: payload.installation.account.login,
            private: repo.private,
            htmlUrl: `https://github.com/${repo.full_name}`,
            isActive: true
          },
          { upsert: true }
        );
      }
    } else if (action === 'removed') {
      for (const repo of payload.repositories_removed) {
        await RepositoryModel.deleteOne({ repoId: repo.id });
      }
    }
  }

  private async handleIssueEvent(payload: any) {
    const action = payload.action;
    const issue = payload.issue;
    const repo = payload.repository;

    logger.info(`GitHub Issue event triggered: ${action} on ${repo.full_name}#${issue.number}`);
    // Webhook actions logic (to be consumed by Agent Service via REST APIs)
  }
}

export const webhookController = new WebhookController();
