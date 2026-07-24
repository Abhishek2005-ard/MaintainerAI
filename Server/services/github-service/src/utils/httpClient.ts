import { logger } from './logger.js';
import { signSystemToken } from './jwt.js';

interface RequestOptions extends RequestInit {
  retries?: number;
  backoff?: number;
}

export const internalRequest = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const retries = options.retries ?? 3;
  const backoff = options.backoff ?? 1000;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${signSystemToken()}`,
    ...(options.headers || {}),
  } as Record<string, string>;

  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`[HTTPClient] Request to ${url} (Attempt ${attempt}/${retries})`);
      const response = await fetch(url, { ...options, headers });

      if (response.ok) {
        return response;
      }

      if (response.status >= 500) {
        logger.warn(`[HTTPClient] Server returned status ${response.status} on attempt ${attempt}. Retrying...`);
      } else {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      logger.warn(`[HTTPClient] Request failed on attempt ${attempt}: ${err.message}. Retrying...`);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError || new Error(`Failed to execute request to ${url} after ${retries} attempts`);
};
