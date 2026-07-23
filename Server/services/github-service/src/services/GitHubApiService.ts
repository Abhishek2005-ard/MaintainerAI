import { Octokit } from 'octokit';
import { App } from 'octokit';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let appInstance: App | undefined;
let appSlugCache: string | null = null;

// Initialize Octokit App
if (env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY) {
  try {
    appInstance = new App({
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

// Get the slug of the authenticated GitHub App dynamically
export const getAppSlug = async (): Promise<string> => {
  if (appSlugCache) return appSlugCache;
  if (!appInstance) {
    logger.warn('GitHub App not initialized. Returning mock app slug.');
    return 'mock-app';
  }
  try {
    const res = await appInstance.octokit.rest.apps.getAuthenticated();
    appSlugCache = (res.data as any).slug || 'mock-app';
    return appSlugCache!;
  } catch (err: any) {
    logger.error(`Failed to fetch authenticated app details: ${err.message}`);
    return 'mock-app';
  }
};

// Get specific installation details from GitHub
export const getInstallationDetails = async (installationId: number): Promise<any> => {
  if (!appInstance) {
    logger.warn('GitHub App not initialized. Returning mock installation details.');
    return {
      id: installationId,
      account: {
        login: 'mock-owner',
        id: 99999,
        type: 'User',
        avatar_url: 'https://github.com/identicons/mock.png'
      },
      permissions: { metadata: 'read', issues: 'write' },
      status: 'active'
    };
  }
  try {
    const { data } = await appInstance.octokit.rest.apps.getInstallation({
      installation_id: installationId
    });
    return data;
  } catch (err: any) {
    logger.error(`Failed to fetch installation details from GitHub: ${err.message}`);
    throw err;
  }
};

// Get Octokit instance authenticated for a specific installation
export const getInstallationClient = async (installationId: number): Promise<Octokit> => {
  if (!appInstance) {
    logger.warn('GitHub App not initialized. Falling back to mock client.');
    return new Octokit(); // Return unauthenticated or fallback mock client
  }
  return await appInstance.getInstallationOctokit(installationId);
};

// Exchange code for OAuth user access token
export const getOAuthAccessToken = async (code: string): Promise<string> => {
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
};

// Get User Profile using user OAuth token
export const getUserProfile = async (token: string): Promise<{ id: number; login: string; email: string; name: string }> => {
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
};

// List installation repositories
export const listInstallationRepositories = async (installationId: number) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
  return data.repositories;
};

// List issues in a repository
export const listIssues = async (installationId: number, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state
  });
  return data;
};

// Create an issue
export const createIssue = async (installationId: number, owner: string, repo: string, title: string, body: string, labels?: string[]) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels
  });
  return data;
};

// Update an issue
export const updateIssue = async (installationId: number, owner: string, repo: string, issueNumber: number, update: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    ...update
  });
  return data;
};

// Create a comment
export const createComment = async (installationId: number, owner: string, repo: string, issueNumber: number, body: string) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
  return data;
};

// Get comments for an issue
export const getComments = async (installationId: number, owner: string, repo: string, issueNumber: number) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber
  });
  return data;
};
