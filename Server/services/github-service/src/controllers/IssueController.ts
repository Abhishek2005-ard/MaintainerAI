import { Request, Response, NextFunction } from 'express';
import * as githubApiService from '../services/GitHubApiService.js';
import * as repositoryService from '../services/RepositoryService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

// GET /repos/:owner/:repo/issues
export const getIssues = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { owner, repo } = req.params;
  const { state } = req.query;

  const repoDetails = await repositoryService.findRepoDetails(owner, repo);
  const issues = await githubApiService.listIssues(
    repoDetails.installationId,
    owner,
    repo,
    (state as any) || 'open'
  );

  res.json({ success: true, count: issues.length, issues });
});

// POST /repos/:owner/:repo/issues
export const createIssue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
});

// PATCH /repos/:owner/:repo/issues/:number
export const updateIssue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
});

// POST /repos/:owner/:repo/issues/:number/comments
export const createComment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
});

// GET /repos/:owner/:repo/issues/:number/comments
export const getComments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { owner, repo, number } = req.params;

  const repoDetails = await repositoryService.findRepoDetails(owner, repo);
  const comments = await githubApiService.getComments(
    repoDetails.installationId,
    owner,
    repo,
    parseInt(number, 10)
  );

  res.json({ success: true, count: comments.length, comments });
});
