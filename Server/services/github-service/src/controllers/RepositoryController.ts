import { Request, Response, NextFunction } from 'express';
import { RepositoryModel } from '../models/RepositoryModel.js';
import { InstallationModel } from '../models/InstallationModel.js';
import { githubApiService } from '../services/GitHubApiService.js';
import { logger } from '../utils/logger.js';

export class RepositoryController {
  // Get all active repositories
  public async getRepositories(req: Request, res: Response, next: NextFunction) {
    try {
      const repos = await RepositoryModel.find({ isActive: true });
      res.json({ success: true, count: repos.length, repositories: repos });
    } catch (err) {
      next(err);
    }
  }

  // Force sync repositories for an installation
  public async syncRepositories(req: Request, res: Response, next: NextFunction) {
    try {
      const { installationId } = req.body;
      if (!installationId) {
        return res.status(400).json({ error: 'installationId is required.' });
      }

      const installation = await InstallationModel.findOne({ installationId });
      if (!installation) {
        return res.status(404).json({ error: 'Installation record not found.' });
      }

      logger.info(`Manually syncing repositories for installation ${installationId}...`);
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

      const updatedRepos = await RepositoryModel.find({ installationId, isActive: true });
      res.json({ success: true, message: 'Repositories successfully synced', repositories: updatedRepos });
    } catch (err) {
      next(err);
    }
  }

  // Toggle triage rules state for a repository
  public async toggleTriageRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullName, active } = req.body;
      if (!fullName) {
        return res.status(400).json({ error: 'fullName is required.' });
      }

      const repo = await RepositoryModel.findOneAndUpdate(
        { fullName },
        { triageRulesActive: !!active },
        { new: true }
      );

      if (!repo) {
        return res.status(404).json({ error: 'Repository not found.' });
      }

      res.json({ success: true, message: `Triage rules toggled to ${repo.triageRulesActive}`, repository: repo });
    } catch (err) {
      next(err);
    }
  }
}

export const repositoryController = new RepositoryController();
