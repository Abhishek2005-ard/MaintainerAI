import * as repositoryService from '../services/RepositoryService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
// Get all active repositories
export const getRepositories = catchAsync(async (req, res, next) => {
    const repos = await repositoryService.getActiveRepositories();
    res.json({ success: true, count: repos.length, repositories: repos });
});
// Force sync repositories for an installation
export const syncRepositories = catchAsync(async (req, res, next) => {
    const { installationId } = req.body;
    if (!installationId) {
        throw new ApiError(400, 'installationId is required.');
    }
    const updatedRepos = await repositoryService.syncRepositoriesForInstallation(installationId);
    res.json({ success: true, message: 'Repositories successfully synced', repositories: updatedRepos });
});
// Toggle triage rules state for a repository
export const toggleTriageRules = catchAsync(async (req, res, next) => {
    const { fullName, active } = req.body;
    if (!fullName) {
        throw new ApiError(400, 'fullName is required.');
    }
    const repo = await repositoryService.toggleTriageRulesForRepo(fullName, !!active);
    res.json({ success: true, message: `Triage rules toggled to ${repo.triageRulesActive}`, repository: repo });
});
