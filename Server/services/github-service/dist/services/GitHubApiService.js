import { Octokit } from 'octokit';
import { App } from 'octokit';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
export class GitHubApiService {
    app;
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
            }
            catch (err) {
                logger.error(`Failed to initialize Octokit App: ${err.message}`);
            }
        }
    }
    // Get Octokit instance authenticated for a specific installation
    async getInstallationClient(installationId) {
        if (!this.app) {
            logger.warn('GitHub App not initialized. Falling back to mock client.');
            return new Octokit(); // Return unauthenticated or fallback mock client
        }
        return await this.app.getInstallationOctokit(installationId);
    }
    // Exchange code for OAuth user access token
    async getOAuthAccessToken(code) {
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
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error_description || data.error);
            }
            return data.access_token;
        }
        catch (err) {
            logger.error(`Error exchanging OAuth code: ${err.message}`);
            throw err;
        }
    }
    // Get User Profile using user OAuth token
    async getUserProfile(token) {
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
    async listInstallationRepositories(installationId) {
        const octokit = await this.getInstallationClient(installationId);
        const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
        return data.repositories;
    }
    // List issues in a repository
    async listIssues(installationId, owner, repo, state = 'open') {
        const octokit = await this.getInstallationClient(installationId);
        const { data } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state
        });
        return data;
    }
    // Create an issue
    async createIssue(installationId, owner, repo, title, body, labels) {
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
    async updateIssue(installationId, owner, repo, issueNumber, update) {
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
    async createComment(installationId, owner, repo, issueNumber, body) {
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
    async getComments(installationId, owner, repo, issueNumber) {
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
