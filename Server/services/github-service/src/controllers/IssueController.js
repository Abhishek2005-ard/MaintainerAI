import * as githubApiService from '../services/GitHubApiService.js';
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

export const getIssues = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repo } = req.params;
    const { state } = req.query;

    const repoDetails = await repositoryService.findRepoDetails(owner, repo);
    const issues = await githubApiService.listIssues(
      repoDetails.installationId,
      owner,
      repo,
      state || 'open'
    );

    res.json({ success: true, count: issues.length, issues });
  } catch (err) {
    next(err);
  }
};

export const createIssue = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repo } = req.params;
    const { title, body, labels } = req.body;

    if (!title || !body) {
      throw new ApiError(400, 'Title and body are required.');
    }

    const repoDetails = await repositoryService.findRepoDetails(owner, repo);
    const newIssue = await githubApiService.createIssue(
      repoDetails.installationId,
      owner,
      repo,
      title,
      body,
      labels
    );

    res.status(201).json({ success: true, issue: newIssue });
  } catch (err) {
    next(err);
  }
};

export const updateIssue = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repo, number } = req.params;
    const { title, body, state, labels } = req.body;

    const repoDetails = await repositoryService.findRepoDetails(owner, repo);
    const updatedIssue = await githubApiService.updateIssue(
      repoDetails.installationId,
      owner,
      repo,
      parseInt(number, 10),
      { title, body, state, labels }
    );

    res.json({ success: true, issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repo, number } = req.params;
    const { body } = req.body;

    if (!body) {
      throw new ApiError(400, 'Comment body is required.');
    }

    const repoDetails = await repositoryService.findRepoDetails(owner, repo);
    const newComment = await githubApiService.createComment(
      repoDetails.installationId,
      owner,
      repo,
      parseInt(number, 10),
      body
    );

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  if (dbNotReady(res)) return;
  try {
    const { owner, repo, number } = req.params;

    const repoDetails = await repositoryService.findRepoDetails(owner, repo);
    const comments = await githubApiService.getComments(
      repoDetails.installationId,
      owner,
      repo,
      parseInt(number, 10)
    );

    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    next(err);
  }
};

