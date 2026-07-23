import { InstallationModel } from '../models/InstallationModel.js';
import { RepositoryModel } from '../models/RepositoryModel.js';
import { IssueModel } from '../models/IssueModel.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { saveRepository } from './InstallationService.js';

export const handleInstallationEvent = async (payload: any) => {
  const action = payload.action;
  const instData = payload.installation;
  const installationId = instData.id;

  logger.info(`GitHub App Installation Action: ${action}`);

  if (action === 'created' || action === 'new_permissions_accepted') {
    // 1. Save/Update installation details in MongoDB
    await InstallationModel.findOneAndUpdate(
      { installationId },
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
    logger.info(`Saved active installation id ${installationId}.`);

    // 2. Save any initial repositories selected during the installation
    if (payload.repositories && Array.isArray(payload.repositories)) {
      logger.info(`Saving ${payload.repositories.length} initial repositories for installation ${installationId}`);
      for (const repo of payload.repositories) {
        await saveRepository(installationId, repo, instData.account.login);
      }
    }
  } else if (action === 'deleted') {
    await InstallationModel.deleteOne({ installationId });
    await RepositoryModel.deleteMany({ installationId });
    logger.info(`Deleted installation id ${installationId}.`);
  } else if (action === 'suspend') {
    await InstallationModel.findOneAndUpdate(
      { installationId },
      { status: 'suspended' }
    );
    logger.info(`Suspended installation id ${installationId}.`);
  } else if (action === 'unsuspend') {
    await InstallationModel.findOneAndUpdate(
      { installationId },
      { status: 'active' }
    );
    logger.info(`Un-suspended installation id ${installationId}.`);
  }
};

export const handleInstallationReposEvent = async (payload: any) => {
  const action = payload.action;
  const instId = payload.installation.id;
  const owner = payload.installation.account.login;

  if (action === 'added') {
    logger.info(`Adding ${payload.repositories_added?.length || 0} repositories for installation ${instId}`);
    for (const repo of payload.repositories_added || []) {
      await saveRepository(instId, repo, owner);
    }
  } else if (action === 'removed') {
    logger.info(`Removing ${payload.repositories_removed?.length || 0} repositories for installation ${instId}`);
    for (const repo of payload.repositories_removed || []) {
      await RepositoryModel.deleteOne({ repoId: repo.id });
    }
  }
};

export const handleIssueEvent = async (payload: any) => {
  const action = payload.action;
  const issue = payload.issue;
  const repo = payload.repository;

  logger.info(`GitHub Issue event triggered: ${action} on ${repo.full_name}#${issue.number}`);

  // Only handle relevant issue events: opened, edited, reopened, closed
  const targetActions = ['opened', 'edited', 'reopened', 'closed'];
  if (!targetActions.includes(action)) {
    logger.info(`Ignored issue event action: ${action}`);
    return;
  }

  // Parse issue metadata into clean schema structure
  const issueData = {
    issueId: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    state: issue.state,
    labels: issue.labels ? issue.labels.map((l: any) => l.name) : [],
    owner: repo.owner.login,
    repoName: repo.name,
    author: issue.user.login,
    htmlUrl: issue.html_url,
    githubCreatedAt: new Date(issue.created_at),
    githubUpdatedAt: new Date(issue.updated_at)
  };

  // Store metadata in MongoDB
  try {
    await IssueModel.findOneAndUpdate(
      { issueId: issueData.issueId },
      issueData,
      { upsert: true, new: true }
    );
    logger.info(`Stored issue metadata in MongoDB: ${repo.full_name}#${issue.number}`);
  } catch (err: any) {
    logger.error(`Failed to save issue metadata to MongoDB: ${err.message}`);
  }

  // Forward event to Agent Service
  const forwardUrl = `${env.AGENT_SERVICE_URL}/webhook`;
  logger.info(`Forwarding issue event to Agent Service at ${forwardUrl}...`);

  try {
    const response = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        issue: issueData,
        repository: {
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login
        }
      })
    });

    if (!response.ok) {
      logger.error(`Agent Service responded with error: ${response.status} ${response.statusText}`);
    } else {
      logger.info(`Successfully forwarded issue event to Agent Service.`);
    }
  } catch (err: any) {
    logger.error(`Failed to forward issue event to Agent Service: ${err.message}`);
    // Do not throw the error to prevent webhook response rejection
  }
};
