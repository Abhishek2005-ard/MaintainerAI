import { env } from '../config/env.js';
import { internalRequest } from '../utils/httpClient.js';
export const fetchRepoContext = async (owner, repo) => {
    try {
        const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos`);
        if (!res.ok)
            return null;
        const data = await res.json();
        const match = (data.repositories || []).find((r) => r.owner === owner && r.name === repo);
        if (!match)
            return null;
        return { name: match.name, fullName: match.fullName, owner: match.owner, description: match.description || '', triageRulesActive: !!match.triageRulesActive };
    }
    catch {
        return null;
    }
};
export const fetchRepoIssues = async (owner, repo) => {
    try {
        const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues?state=open`);
        if (!res.ok)
            return [];
        const data = await res.json();
        return (data.issues || []).map((i) => ({
            number: i.number,
            title: i.title || '',
            body: i.body || '',
            labels: (i.labels || []).map((l) => typeof l === 'string' ? l : l.name),
            state: i.state || 'open',
        }));
    }
    catch {
        return [];
    }
};
export const markIssueAsDuplicate = async (owner, repo, number, duplicateOf) => {
    try {
        const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues/${number}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body: `This issue appears to be a duplicate of #${duplicateOf}. Please check that issue for updates.` }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
};
export const addLabelsToIssue = async (owner, repo, number, labels) => {
    try {
        const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues/${number}`, {
            method: 'PATCH',
            body: JSON.stringify({ labels }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
};
export const postCommentToIssue = async (owner, repo, number, body) => {
    try {
        const res = await internalRequest(`${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues/${number}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
};
