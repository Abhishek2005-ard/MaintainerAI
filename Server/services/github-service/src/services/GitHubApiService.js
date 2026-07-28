import { Octokit } from 'octokit';
import { App } from 'octokit';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let appInstance;
let appSlugCache = null;

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
  } catch (err) {
    logger.error(`Failed to initialize Octokit App: ${err.message}`);
  }
}

// Get the slug of the authenticated GitHub App dynamically
export const getAppSlug = async () => {
  if (appSlugCache) return appSlugCache;
  if (!appInstance) {
    logger.warn('GitHub App not initialized. Returning mock app slug.');
    return 'mock-app';
  }
  try {
    const res = await appInstance.octokit.rest.apps.getAuthenticated();
    appSlugCache = res.data.slug || 'mock-app';
    return appSlugCache;
  } catch (err) {
    logger.error(`Failed to fetch authenticated app details: ${err.message}`);
    return 'mock-app';
  }
};

// Get specific installation details from GitHub
export const getInstallationDetails = async (installationId) => {
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
  } catch (err) {
    logger.error(`Failed to fetch installation details from GitHub: ${err.message}`);
    throw err;
  }
};

// Get Octokit instance authenticated for a specific installation
export const getInstallationClient = async (installationId) => {
  if (!appInstance) {
    logger.warn('GitHub App not initialized. Falling back to mock client.');
    return new Octokit(); // Return unauthenticated or fallback mock client
  }
  return await appInstance.getInstallationOctokit(installationId);
};

// Exchange code for OAuth user access token
export const getOAuthAccessToken = async (code) => {
  try {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new Error('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing in environment configuration.');
    }

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
  } catch (err) {
    logger.error(`Error exchanging OAuth code: ${err.message}`);
    throw err;
  }
};

// Get User Profile using user OAuth token
export const getUserProfile = async (token) => {
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
export const listInstallationRepositories = async (installationId) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
  return data.repositories;
};

// List issues in a repository
export const listIssues = async (installationId, owner, repo, state = 'open') => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state
  });
  return data;
};

// Create an issue
export const createIssue = async (installationId, owner, repo, title, body, labels) => {
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
export const updateIssue = async (installationId, owner, repo, issueNumber, update) => {
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
export const createComment = async (installationId, owner, repo, issueNumber, body) => {
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
export const getComments = async (installationId, owner, repo, issueNumber) => {
  const octokit = await getInstallationClient(installationId);
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber
  });
  return data;
};
