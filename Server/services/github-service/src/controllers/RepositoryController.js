import * as repositoryService from '../services/RepositoryService.js';
import { ApiError } from '../utils/ApiError.js';

// Get all active repositories
export const getRepositories = async (req, res, next) => {
  try {
    const repos = await repositoryService.getActiveRepositories();
    res.json({ success: true, count: repos.length, repositories: repos });
  } catch (err) {
    next(err);
  }
};

// Force sync repositories for an installation
export const syncRepositories = async (req, res, next) => {
  try {
    const { installationId } = req.body;
    if (!installationId) {
      throw new ApiError(400, 'installationId is required.');
    }

    const updatedRepos = await repositoryService.syncRepositoriesForInstallation(installationId);
    res.json({ success: true, message: 'Repositories successfully synced', repositories: updatedRepos });
  } catch (err) {
    next(err);
  }
};

// Toggle triage rules state for a repository
export const toggleTriageRules = async (req, res, next) => {
  try {
    const { fullName, active } = req.body;
    if (!fullName) {
      throw new ApiError(400, 'fullName is required.');
    }

    const repo = await repositoryService.toggleTriageRulesForRepo(fullName, !!active);
    res.json({ success: true, message: `Triage rules toggled to ${repo.triageRulesActive}`, repository: repo });
  } catch (err) {
    next(err);
  }
};

// Update custom triage rules for a specific repository
export const updateTriageRules = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { customLabels, customPriorities, customPromptHints } = req.body;

    if (!owner || !repo) {
      throw new ApiError(400, 'owner and repo path params are required.');
    }

    const updatedRepo = await repositoryService.saveTriageRules(owner, repo, {
      customLabels,
      customPriorities,
      customPromptHints,
    });

    res.json({
      success: true,
      message: 'Triage rules updated successfully.',
      triageRules: updatedRepo.triageRules,
    });
  } catch (err) {
    next(err);
  }
};
