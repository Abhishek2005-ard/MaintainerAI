import { Octokit } from 'octokit';
import { App } from 'octokit';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class GitHubApiService {
  private app?: App;

  constructor() {
    if (env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY) {
      try {
        this.app = new App({
          appId: env.GITHUB_APP_ID,
          privateKey: env.GITHUB_PRIVATE_KEY,
          webhooks: {
            secret: env.GITHUB_WEBHOOK_SECRET
          }
        });
        logger.info('Octokit App initialized successfully.');
      } catch (err: any) {
        logger.error(`Failed to initialize Octokit App: ${err.message}`);
      }
    }
  }

  // Get Octokit instance authenticated for a specific installation
  public async getInstallationClient(installationId: number): Promise<Octokit> {
    if (!this.app) {
      logger.warn('GitHub App not initialized. Falling back to mock client.');
      return new Octokit(); // Return unauthenticated or fallback mock client
    }
    return await this.app.getInstallationOctokit(installationId);
  }

  // Exchange code for OAuth user access token
  public async getOAuthAccessToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const data: any = await response.json();
      if (data.error) {
        throw new Error(data.error_description || data.error);
      }
      return data.access_token;
    } catch (err: any) {
      logger.error(`Error exchanging OAuth code: ${err.message}`);
      throw err;
    }
  }

  // Get User Profile using user OAuth token
  public async getUserProfile(token: string): Promise<{ id: number; login: string; email: string; name: string }> {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // Get emails
    const { data: emails } = await octokit.rest.users.listEmailsForAuthenticatedUser();
    const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email || '';

    return {
      id: user.id,
      login: user.login,
      email: primaryEmail,
      name: user.name || user.login
    };
  }

  // List installation repositories
  public async listInstallationRepositories(installationId: number) {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
    return data.repositories;
  }

  // List issues in a repository
  public async listIssues(installationId: number, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state
    });
    return data;
  }

  // Create an issue
  public async createIssue(installationId: number, owner: string, repo: string, title: string, body: string, labels?: string[]) {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels
    });
    return data;
  }

  // Update an issue
  public async updateIssue(installationId: number, owner: string, repo: string, issueNumber: number, update: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }) {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...update
    });
    return data;
  }

  // Create a comment
  public async createComment(installationId: number, owner: string, repo: string, issueNumber: number, body: string) {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return data;
  }

  // Get comments for an issue
  public async getComments(installationId: number, owner: string, repo: string, issueNumber: number) {
    const octokit = await this.getInstallationClient(installationId);
    const { data } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber
    });
    return data;
  }
}

export const githubApiService = new GitHubApiService();
