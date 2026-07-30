import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { env } from '../config/env.js';
import { signSystemToken } from '../utils/jwt.js';

const base = env.GITHUB_SERVICE_URL;

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${signSystemToken()}`,
});

// Get repository info (description, triage status, etc.)
export const getRepoInfoTool = tool(
  async ({ owner, repo }) => {
    try {
      const res = await fetch(`${base}/repos`, { headers: headers() });
      if (!res.ok) return `Failed to fetch repos (${res.status})`;
      const data = await res.json();
      const match = (data.repositories || []).find((r) => r.owner === owner && r.name === repo);
      return match ? JSON.stringify(match) : `Repo ${owner}/${repo} not found`;
    } catch (err) {
      return `Failed to fetch repository metadata: ${err.message}`;
    }
  },
  {
    name: 'get_repo_info',
    description: 'Get metadata for a GitHub repository',
    schema: z.object({
      owner: z.string().describe('GitHub username or org'),
      repo:  z.string().describe('Repository name'),
    }),
  }
);

// Fetch issues for a repo
export const getIssuesTool = tool(
  async ({ owner, repo, state = 'open' }) => {
    try {
      const res = await fetch(`${base}/repos/${owner}/${repo}/issues?state=${state}`, { headers: headers() });
      if (!res.ok) return `Failed to fetch issues (${res.status})`;
      const data = await res.json();
      return JSON.stringify(data.issues || []);
    } catch (err) {
      return `Failed to fetch issues: ${err.message}`;
    }
  },
  {
    name: 'get_issues',
    description: 'Fetch issues from a GitHub repository',
    schema: z.object({
      owner: z.string().describe('Repository owner'),
      repo:  z.string().describe('Repository name'),
      state: z.enum(['open', 'closed', 'all']).optional().describe('Filter by state (default: open)'),
    }),
  }
);

// Add labels to an issue
export const addLabelsTool = tool(
  async ({ owner, repo, issueNumber, labels }) => {
    try {
      const res = await fetch(`${base}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ labels }),
      });
      return res.ok ? `Labels [${labels.join(', ')}] added to #${issueNumber}` : `Failed (${res.status})`;
    } catch (err) {
      return `Failed to add labels: ${err.message}`;
    }
  },
  {
    name: 'add_labels',
    description: 'Add labels to a GitHub issue',
    schema: z.object({
      owner:       z.string().describe('Repository owner'),
      repo:        z.string().describe('Repository name'),
      issueNumber: z.number().describe('Issue number'),
      labels:      z.array(z.string()).describe('Label names to apply'),
    }),
  }
);

// Post a comment on an issue
export const postCommentTool = tool(
  async ({ owner, repo, issueNumber, body }) => {
    try {
      const res = await fetch(`${base}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ body }),
      });
      return res.ok ? `Comment posted on #${issueNumber}` : `Failed (${res.status})`;
    } catch (err) {
      return `Failed to post comment: ${err.message}`;
    }
  },
  {
    name: 'post_comment',
    description: 'Post a comment on a GitHub issue',
    schema: z.object({
      owner:       z.string().describe('Repository owner'),
      repo:        z.string().describe('Repository name'),
      issueNumber: z.number().describe('Issue number'),
      body:        z.string().describe('Comment text (markdown supported)'),
    }),
  }
);

// Close an issue
export const closeIssueTool = tool(
  async ({ owner, repo, issueNumber }) => {
    try {
      const res = await fetch(`${base}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ state: 'closed' }),
      });
      return res.ok ? `Issue #${issueNumber} closed` : `Failed (${res.status})`;
    } catch (err) {
      return `Failed to close issue: ${err.message}`;
    }
  },
  {
    name: 'close_issue',
    description: 'Close a GitHub issue',
    schema: z.object({
      owner:       z.string().describe('Repository owner'),
      repo:        z.string().describe('Repository name'),
      issueNumber: z.number().describe('Issue number to close'),
    }),
  }
);

// Reopen a closed issue
export const reopenIssueTool = tool(
  async ({ owner, repo, issueNumber }) => {
    try {
      const res = await fetch(`${base}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ state: 'open' }),
      });
      return res.ok ? `Issue #${issueNumber} reopened` : `Failed (${res.status})`;
    } catch (err) {
      return `Failed to reopen issue: ${err.message}`;
    }
  },
  {
    name: 'reopen_issue',
    description: 'Reopen a closed GitHub issue',
    schema: z.object({
      owner:       z.string().describe('Repository owner'),
      repo:        z.string().describe('Repository name'),
      issueNumber: z.number().describe('Issue number to reopen'),
    }),
  }
);

// All tools in one array — use with llm.bindTools(githubAgentTools)
export const githubAgentTools = [
  getRepoInfoTool,
  getIssuesTool,
  addLabelsTool,
  postCommentTool,
  closeIssueTool,
  reopenIssueTool,
];
