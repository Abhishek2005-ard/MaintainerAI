import { env } from '../config/env.js';
import { signSystemToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

const getHeaders = () => {
  const token = signSystemToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Call the GitHub microservice to update labels on a specific issue.
 */
export const addLabelsToIssue = async (owner: string, repo: string, number: number, labels: string[]) => {
  const url = `${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues/${number}`;
  logger.info(`Tool called: addLabelsToIssue for ${owner}/${repo}#${number} labels=${labels}`);

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ labels })
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`Failed to add labels to issue: ${res.status} ${errText}`);
      return false;
    }

    logger.info(`Successfully added labels to ${owner}/${repo}#${number}`);
    return true;
  } catch (err: any) {
    logger.error(`Exception in addLabelsToIssue tool: ${err.message}`);
    return false;
  }
};

/**
 * Call the GitHub microservice to add a comment on a specific issue.
 */
export const postCommentToIssue = async (owner: string, repo: string, number: number, body: string) => {
  const url = `${env.GITHUB_SERVICE_URL}/repos/${owner}/${repo}/issues/${number}/comments`;
  logger.info(`Tool called: postCommentToIssue for ${owner}/${repo}#${number}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ body })
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`Failed to post comment to issue: ${res.status} ${errText}`);
      return false;
    }

    logger.info(`Successfully posted comment to ${owner}/${repo}#${number}`);
    return true;
  } catch (err: any) {
    logger.error(`Exception in postCommentToIssue tool: ${err.message}`);
    return false;
  }
};
