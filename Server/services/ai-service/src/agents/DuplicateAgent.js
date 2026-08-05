import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const VECTOR_THRESHOLD = 0.75;
const TEXT_FALLBACK_THRESHOLD = 0.25;

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
  'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'this', 'that', 'these', 'those'
]);

function getStemTokens(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function computeTextSimilarity(titleA, bodyA, titleB, bodyB) {
  const titleTokensA = getStemTokens(titleA);
  const titleTokensB = getStemTokens(titleB);
  
  const setA = new Set(titleTokensA);
  const setB = new Set(titleTokensB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let titleCommon = 0;
  for (const token of setA) {
    if (setB.has(token)) titleCommon++;
  }

  const titleMin = Math.min(setA.size, setB.size);
  const titleOverlap = titleMin > 0 ? titleCommon / titleMin : 0;
  const titleJaccard = (setA.size + setB.size - titleCommon) > 0 ? titleCommon / (setA.size + setB.size - titleCommon) : 0;
  const titleScore = (titleOverlap * 0.70) + (titleJaccard * 0.30);

  const normA = (titleA || '').toLowerCase().trim();
  const normB = (titleB || '').toLowerCase().trim();
  const phraseBonus = (normA.includes(normB) || normB.includes(normA)) && normA.length > 3 ? 0.40 : 0;

  const bodyTokensA = getStemTokens(bodyA);
  const bodyTokensB = getStemTokens(bodyB);
  const bodySetA = new Set(bodyTokensA);
  const bodySetB = new Set(bodyTokensB);

  let bodyCommon = 0;
  for (const token of bodySetA) {
    if (bodySetB.has(token)) bodyCommon++;
  }

  const bodyMin = Math.min(bodySetA.size, bodySetB.size);
  const bodyOverlap = bodyMin > 0 ? bodyCommon / bodyMin : 0;

  return Math.min(1.0, (titleScore * 0.60) + (bodyOverlap * 0.20) + phraseBonus);
}

import { getCache, setCache } from '../../../shared/redisClient.js';

async function generateTextEmbedding(text) {
  if (!text || text.trim().length === 0) return [];
  
  // Clean cache key based on basic string hashing
  const cacheKey = `emb:${Buffer.from(text.slice(0, 100)).toString('base64').replace(/=/g, '')}`;
  try {
    const cached = await getCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (_) {}

  let model;
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    model = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
  } else if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5) {
    model = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    });
  }

  if (!model) {
    return [];
  }

  try {
    const result = await Promise.race([
      model.embedQuery(text),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Embedding API timeout')), 4000))
    ]);
    if (result && result.length > 0) {
      await setCache(cacheKey, result, 86400); // cache for 24h
    }
    return result;
  } catch (err) {
    logger.warn(`DuplicateAgent: Embedding API skipped (${err.message}). Using smart NLP similarity fallback.`);
    return [];
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Compares an incoming issue against candidate repository issues to detect potential duplicates.
 */
export async function detectDuplicate(issue, candidates) {
  logger.info(`DuplicateAgent: Checking issue #${issue.number} ("${issue.title}") against ${candidates?.length ?? 0} candidate issues.`);

  if (!candidates || candidates.length === 0) {
    return {
      isDuplicate: false,
      duplicateOfNumber: null,
      similarityScore: 0,
      issueEmbedding: [],
    };
  }

  const currentText = `${issue.title}\n\n${issue.body}`;
  const issueEmbedding = await generateTextEmbedding(currentText);
  const useVector = issueEmbedding && issueEmbedding.length > 0;

  let bestScore = 0;
  let bestCandidate = null;

  for (const candidate of candidates) {
    if (candidate.number === issue.number) continue;

    let score = 0;
    let mode = 'nlp';

    if (useVector) {
      const candidateEmbedding = await generateTextEmbedding(`${candidate.title}\n\n${candidate.body}`);
      if (candidateEmbedding && candidateEmbedding.length > 0) {
        score = cosineSimilarity(issueEmbedding, candidateEmbedding);
        mode = 'vector';
      } else {
        score = computeTextSimilarity(issue.title, issue.body, candidate.title, candidate.body);
        mode = 'nlp-fallback';
      }
    } else {
      score = computeTextSimilarity(issue.title, issue.body, candidate.title, candidate.body);
      mode = 'nlp';
    }

    const threshold = mode === 'vector' ? VECTOR_THRESHOLD : TEXT_FALLBACK_THRESHOLD;
    const isCandidateMatch = score >= threshold;

    logger.info(
      `[DuplicateAgent] Candidate #${candidate.number} ("${candidate.title.slice(0, 35)}"): score=${score.toFixed(3)} (mode=${mode}, threshold=${threshold}) match=${isCandidateMatch}`
    );

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  const effectiveThreshold = (useVector && bestCandidate && bestScore >= VECTOR_THRESHOLD) ? VECTOR_THRESHOLD : TEXT_FALLBACK_THRESHOLD;
  const isDuplicate = bestCandidate !== null && bestScore >= effectiveThreshold;
  const duplicateOfNumber = isDuplicate ? bestCandidate.number : null;

  logger.info(
    `DuplicateAgent Final Result: candidatesCount=${candidates.length} bestMatch=#${duplicateOfNumber ?? 'none'} score=${bestScore.toFixed(3)} isDuplicate=${isDuplicate}`
  );

  return {
    isDuplicate,
    duplicateOfNumber,
    similarityScore: bestScore,
    issueEmbedding,
  };
}

