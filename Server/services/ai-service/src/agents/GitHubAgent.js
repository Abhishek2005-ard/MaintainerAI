import * as github from '../tools/githubTools.js';

// Thin wrapper around githubTools — one place for all GitHub side-effects.

export function fetchRepoContext(owner, repo) {
  return github.fetchRepoContext(owner, repo);
}

export async function fetchOpenIssues(owner, repo, excludeNumber) {
  const issues = await github.fetchRepoIssues(owner, repo);
  return issues.filter(i => i.number !== excludeNumber);
}

export function applyLabels(owner, repo, number, labels) {
  return github.addLabelsToIssue(owner, repo, number, labels);
}

export function postComment(owner, repo, number, body) {
  return github.postCommentToIssue(owner, repo, number, body);
}

export function markDuplicate(owner, repo, number, duplicateOf) {
  return github.markIssueAsDuplicate(owner, repo, number, duplicateOf);
}

export function postTriageComment(owner, repo, number, analysis, labels, priority) {
  return github.postTriageComment(owner, repo, number, analysis, labels, priority);
}

