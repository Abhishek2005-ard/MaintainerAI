import { env } from '../config/env.js';
import { internalRequest } from '../utils/httpClient.js';

export const fetchRepoContext = async (owner, repo) => {
  try {
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos`);
    if (!res.ok) return null;
    const data = await res.json();
    const match = (data.repositories || []).find((r) => r.owner === owner && r.name === repo);
    if (!match) return null;
    return { name: match.name, fullName: match.fullName, owner: match.owner, description: match.description || '', triageRulesActive: !!match.triageRulesActive };
  } catch {
    return null;
  }
};

export const fetchRepoIssues = async (owner, repo) => {
  try {
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues?state=all`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.issues || []).map((i) => ({
      number: i.number,
      title:  i.title  || '',
      body:   i.body   || '',
      labels: (i.labels || []).map((l) => typeof l === 'string' ? l : l.name),
      state:  i.state  || 'open',
    }));
  } catch {
    return [];
  }
};

// Post a simple, human-like duplicate notification comment
export const markIssueAsDuplicate = async (owner, repo, number, duplicateOf) => {
  try {
    const comment = [
      `Thanks for opening this issue!`,
      ``,
      `This appears to be a duplicate of **#${duplicateOf}**.`,
      ``,
      `To keep all discussions consolidated in one place, we are closing this issue. Please feel free to add your thoughts and any extra details on **#${duplicateOf}**.`,
    ].join('\n');

    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const addLabelsToIssue = async (owner, repo, number, labels) => {
  try {
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({ labels }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Post a clear, human-like triage confirmation comment
export const postTriageComment = async (owner, repo, number, analysis, labels, priority) => {
  try {
    const priorityLabel = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Low';

    const comment = [
      `Thanks for submitting this issue!`,
      ``,
      `**Summary:**`,
      `- **Category:** ${analysis?.category ? analysis.category.toUpperCase() : 'General'}`,
      `- **Priority:** ${priorityLabel}`,
      labels.length > 0 ? `- **Labels:** ${labels.map(l => `\`${l}\``).join(', ')}` : '',
      ``,
      analysis?.reasoning ? `**Note:** ${analysis.reasoning}` : '',
      ``,
      `We have processed this report and queued it for maintainer review.`,
    ].filter(Boolean).join('\n');

    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const postCommentToIssue = async (owner, repo, number, body) => {
  try {
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const closeIssueOnGitHub = async (owner, repo, number) => {
  try {
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' }),
    });
    return res.ok;
  } catch {
    return false;
  }
};
