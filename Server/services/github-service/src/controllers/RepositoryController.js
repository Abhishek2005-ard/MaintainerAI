import * as repositoryService from '../services/RepositoryService.js';
import { ApiError } from '../utils/ApiError.js';
import { isConnected } from '../config/db.js';

/**
 * Checks if the MongoDB connection is active and returns a service unavailable error if disconnected.
 */
function dbNotReady(res) {
  if (!isConnected()) {
    res.status(503).json({
      error: 'Database unavailable — MongoDB Atlas is not connected. '
           + 'Check GITHUB_MONGO_URI in .env and ensure your IP is whitelisted in Atlas.',
    });
    return true;
  }
  return false;
}

export const getRepositories = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const repos = await repositoryService.getActiveRepositories();
    res.json({ success: true, count: repos.length, repositories: repos });
  } catch (err) {
    next(err);
  }
};

export const syncRepositories = async (req, res, next) => {
  if (dbNotReady(res)) return;
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

export const toggleTriageRules = async (req, res, next) => {
  if (dbNotReady(res)) return;
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

export const updateTriageRules = async (req, res, next) => {
  if (dbNotReady(res)) return;
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

