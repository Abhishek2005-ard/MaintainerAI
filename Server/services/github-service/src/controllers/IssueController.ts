import { Request, Response, NextFunction } from 'express';
import { githubApiService } from '../services/GitHubApiService.js';
import { RepositoryModel } from '../models/RepositoryModel.js';
import { logger } from '../utils/logger.js';

export class IssueController {
  // Helper to find repository and its installationId
  private async findRepoDetails(owner: string, name: string) {
    const repo = await RepositoryModel.findOne({ owner, name });
    if (!repo) {
      throw new Error(`Repository ${owner}/${name} not configured locally.`);
    }
    return repo;
  }

  // GET /repos/:owner/:repo/issues
  public async getIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo } = req.params;
      const { state } = req.query;

      const repoDetails = await this.findRepoDetails(owner, repo);
      const issues = await githubApiService.listIssues(
        repoDetails.installationId,
        owner,
        repo,
        (state as any) || 'open'
      );

      res.json({ success: true, count: issues.length, issues });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  // POST /repos/:owner/:repo/issues
  public async createIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo } = req.params;
      const { title, body, labels } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required.' });
      }

      const repoDetails = await this.findRepoDetails(owner, repo);
      const newIssue = await githubApiService.createIssue(
        repoDetails.installationId,
        owner,
        repo,
        title,
        body,
        labels
      );

      res.status(201).json({ success: true, issue: newIssue });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  // PATCH /repos/:owner/:repo/issues/:number
  public async updateIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo, number } = req.params;
      const { title, body, state, labels } = req.body;

      const repoDetails = await this.findRepoDetails(owner, repo);
      const updatedIssue = await githubApiService.updateIssue(
        repoDetails.installationId,
        owner,
        repo,
        parseInt(number, 10),
        { title, body, state, labels }
      );

      res.json({ success: true, issue: updatedIssue });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  // POST /repos/:owner/:repo/issues/:number/comments
  public async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo, number } = req.params;
      const { body } = req.body;

      if (!body) {
        return res.status(400).json({ error: 'Comment body is required.' });
      }

      const repoDetails = await this.findRepoDetails(owner, repo);
      const newComment = await githubApiService.createComment(
        repoDetails.installationId,
        owner,
        repo,
        parseInt(number, 10),
        body
      );

      res.status(201).json({ success: true, comment: newComment });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  // GET /repos/:owner/:repo/issues/:number/comments
  public async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo, number } = req.params;

      const repoDetails = await this.findRepoDetails(owner, repo);
      const comments = await githubApiService.getComments(
        repoDetails.installationId,
        owner,
        repo,
        parseInt(number, 10)
      );

      res.json({ success: true, count: comments.length, comments });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}

export const issueController = new IssueController();
