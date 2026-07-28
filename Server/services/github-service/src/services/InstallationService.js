import { InstallationModel } from '../models/InstallationModel.js';
import { RepositoryModel } from '../models/RepositoryModel.js';
import * as githubApiService from './GitHubApiService.js';
import { logger } from '../utils/logger.js';

/**
 * Saves/updates a single repository in MongoDB.
 */
export const saveRepository = async (installationId, repo, owner) => {
  return await RepositoryModel.findOneAndUpdate(
    { repoId: repo.id },
    {
      installationId,
      name: repo.name,
      fullName: repo.full_name,
      owner,
      private: repo.private,
      htmlUrl: repo.html_url || `https://github.com/${repo.full_name}`,
      description: repo.description || undefined,
      isActive: true
    },
    { upsert: true, new: true }
  );
};

/**
 * Syncs the Installation details and all associated repositories from GitHub to MongoDB.
 * Commonly triggered during installation setup callback.
 */
export const syncInstallationAndRepos = async (installationId) => {
  logger.info(`Syncing installation and repositories for installationId: ${installationId}`);

  // 1. Fetch installation details from GitHub
  const instData = await githubApiService.getInstallationDetails(installationId);

  // 2. Save/Update installation details in MongoDB
  const installation = await InstallationModel.findOneAndUpdate(
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

  // 3. Fetch list of accessible repositories for this installation from GitHub
  const gitHubRepos = await githubApiService.listInstallationRepositories(installationId);
  const activeRepoIds = [];

  // 4. Save/Update each repository in MongoDB
  for (const repo of gitHubRepos) {
    activeRepoIds.push(repo.id);
    await saveRepository(installationId, repo, instData.account.login);
  }

  // 5. Deactivate any repositories that are no longer associated with this installation
  await RepositoryModel.updateMany(
    { installationId, repoId: { $nin: activeRepoIds } },
    { isActive: false }
  );

  logger.info(`Successfully synced installation ${installationId} with ${activeRepoIds.length} active repos.`);
  return { installation, activeReposCount: activeRepoIds.length };
};
