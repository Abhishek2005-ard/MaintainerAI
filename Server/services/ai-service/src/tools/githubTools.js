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
    const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/issues/${owner}/${repo}/issues?state=open`);
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

export const markIssueAsDuplicate = async (owner, repo, number, duplicateOf) => {
  try {
    const comment = [
      '## 🤖 MaintainerAI — Duplicate Detected',
      '',
      `This issue appears to be a **duplicate** of **#${duplicateOf}**.`,
      '',
      '**What this means:**',
      `- The issue tracker already has a very similar report at #${duplicateOf}`,
      '- This issue will be closed to keep the tracker clean',
      `- Please 👍 react to #${duplicateOf} to show your interest and add any new details there`,
      '',
      '> _Detected automatically by [MaintainerAI](https://github.com/apps/maintainerai) using semantic similarity analysis._',
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

export const postTriageComment = async (owner, repo, number, analysis, labels, priority) => {
  try {
    const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[priority] ?? '⚪';
    const burnoutNote = analysis?.burnoutRisk
      ? '\n\n> ⚠️ **Burnout risk detected** — the tone of this issue may indicate frustration. Maintainers please be extra empathetic in your response.'
      : '';

    const comment = [
      '## 🤖 MaintainerAI — Issue Triaged',
      '',
      `| Field | Value |`,
      `|-------|-------|`,
      `| **Category** | ${analysis?.category ?? 'other'} |`,
      `| **Priority** | ${priorityEmoji} ${priority} |`,
      `| **Labels applied** | ${labels.length > 0 ? labels.map(l => `\`${l}\``).join(', ') : '_none_'} |`,
      `| **Duplicate** | No |`,
      '',
      analysis?.reasoning ? `**AI Reasoning:** ${analysis.reasoning}` : '',
      burnoutNote,
      '',
      '> _Triaged automatically by [MaintainerAI](https://github.com/apps/maintainerai)._',
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
