import { RepositoryModel } from '../models/RepositoryModel.js';
import { InstallationModel } from '../models/InstallationModel.js';
import { ApiError } from '../utils/ApiError.js';
import * as githubApiService from './GitHubApiService.js';

export const findRepoDetails = async (owner: string, name: string) => {
  const repo = await RepositoryModel.findOne({ owner, name });
  if (!repo) {
    throw new ApiError(404, `Repository ${owner}/${name} not configured locally.`);
  }
  return repo;
};

export const getActiveRepositories = async () => {
  return await RepositoryModel.find({ isActive: true });
};

export const syncRepositoriesForInstallation = async (installationId: number) => {
  const installation = await InstallationModel.findOne({ installationId });
  if (!installation) {
    throw new ApiError(404, 'Installation record not found.');
  }

  const gitHubRepos = await githubApiService.listInstallationRepositories(installationId);
  const activeRepoIds: number[] = [];

  for (const repo of gitHubRepos) {
    activeRepoIds.push(repo.id);
    await RepositoryModel.findOneAndUpdate(
      { repoId: repo.id },
      {
        installationId,
        name: repo.name,
        fullName: repo.full_name,
        owner: installation.accountName,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description || undefined,
        isActive: true
      },
      { upsert: true }
    );
  }

  // Deactivate any repositories no longer associated with installation
  await RepositoryModel.updateMany(
    { installationId, repoId: { $nin: activeRepoIds } },
    { isActive: false }
  );

  return await RepositoryModel.find({ installationId, isActive: true });
};

export const toggleTriageRulesForRepo = async (fullName: string, active: boolean) => {
  const repo = await RepositoryModel.findOneAndUpdate(
    { fullName },
    { triageRulesActive: active },
    { new: true }
  );

  if (!repo) {
    throw new ApiError(404, 'Repository not found.');
  }

  return repo;
};
