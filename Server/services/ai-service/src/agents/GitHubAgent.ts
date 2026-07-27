import * as github from '../tools/githubTools.js';
import type { RepoContext, SimilarIssue } from '../types/index.js';

// Thin wrapper around githubTools — one place for all GitHub side-effects.

export function fetchRepoContext(owner: string, repo: string): Promise<RepoContext | null> {
  return github.fetchRepoContext(owner, repo);
}

export async function fetchOpenIssues(owner: string, repo: string, excludeNumber: number): Promise<SimilarIssue[]> {
  const issues = await github.fetchRepoIssues(owner, repo);
  return issues.filter(i => i.number !== excludeNumber);
}

export function applyLabels(owner: string, repo: string, number: number, labels: string[]): Promise<boolean> {
  return github.addLabelsToIssue(owner, repo, number, labels);
}

export function postComment(owner: string, repo: string, number: number, body: string): Promise<boolean> {
  return github.postCommentToIssue(owner, repo, number, body);
}

export function markDuplicate(owner: string, repo: string, number: number, duplicateOf: number): Promise<boolean> {
  return github.markIssueAsDuplicate(owner, repo, number, duplicateOf);
}
