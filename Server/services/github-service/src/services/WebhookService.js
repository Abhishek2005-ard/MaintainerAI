import { InstallationModel } from '../models/InstallationModel.js';
import { RepositoryModel } from '../models/RepositoryModel.js';
import { IssueModel } from '../models/IssueModel.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { saveRepository } from './InstallationService.js';
import { internalRequest } from '../utils/httpClient.js';

export const handleInstallationEvent = async (payload) => {
  const action = payload.action;
  const inst   = payload.installation;

  logger.info(`Installation event: ${action} (id=${inst.id})`);

  if (action === 'created' || action === 'new_permissions_accepted') {
    await InstallationModel.findOneAndUpdate(
      { installationId: inst.id },
      { accountName: inst.account.login, accountId: inst.account.id, accountType: inst.account.type, avatarUrl: inst.account.avatar_url, permissions: inst.permissions, status: 'active' },
      { upsert: true, new: true }
    );
    for (const repo of payload.repositories || []) {
      await saveRepository(inst.id, repo, inst.account.login);
    }
  } else if (action === 'deleted') {
    await InstallationModel.deleteOne({ installationId: inst.id });
    await RepositoryModel.deleteMany({ installationId: inst.id });
  } else if (action === 'suspend') {
    await InstallationModel.findOneAndUpdate({ installationId: inst.id }, { status: 'suspended' });
  } else if (action === 'unsuspend') {
    await InstallationModel.findOneAndUpdate({ installationId: inst.id }, { status: 'active' });
  }
};

export const handleInstallationReposEvent = async (payload) => {
  const instId = payload.installation.id;
  const owner  = payload.installation.account.login;

  if (payload.action === 'added') {
    for (const repo of payload.repositories_added || []) {
      await saveRepository(instId, repo, owner);
    }
  } else if (payload.action === 'removed') {
    for (const repo of payload.repositories_removed || []) {
      await RepositoryModel.deleteOne({ repoId: repo.id });
    }
  }
};

export const handleIssueEvent = async (payload) => {
  const { action, issue, repository: repo } = payload;

  logger.info(`Issue event: ${action} on ${repo.full_name}#${issue.number}`);

  const targetActions = ['opened', 'edited', 'reopened', 'closed'];
  if (!targetActions.includes(action)) return;

  const issueData = {
    issueId:          issue.id,
    number:           issue.number,
    title:            issue.title,
    body:             issue.body || '',
    state:            issue.state,
    labels:           (issue.labels || []).map((l) => l.name),
    owner:            repo.owner.login,
    repoName:         repo.name,
    author:           issue.user.login,
    htmlUrl:          issue.html_url,
    githubCreatedAt:  new Date(issue.created_at),
    githubUpdatedAt:  new Date(issue.updated_at),
  };

  try {
    await IssueModel.findOneAndUpdate({ issueId: issueData.issueId }, issueData, { upsert: true, new: true });
  } catch (err) {
    logger.error(`Failed to save issue to MongoDB: ${err.message}`);
  }

  const forwardUrl = `${env.AGENT_SERVICE_URL}/webhook`;
  logger.info(`Forwarding issue event to Agent Service at ${forwardUrl}...`);

  try {
    const response = await internalRequest(forwardUrl, {
      method: 'POST',
      body: JSON.stringify({
        action,
        issue: issueData,
        repository: { id: repo.id, name: repo.name, fullName: repo.full_name, owner: repo.owner.login },
      }),
    });
    if (!response.ok) {
      logger.error(`Agent service error: ${response.status}`);
    } else {
      logger.info(`Successfully forwarded issue event to Agent Service.`);
    }
  } catch (err) {
    logger.error(`Failed to forward issue event to Agent Service: ${err.message}`);
  }
};
