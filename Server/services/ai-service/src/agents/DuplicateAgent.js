import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Issues with vector similarity above this score are considered duplicates.
const VECTOR_THRESHOLD = 0.78;
const TEXT_FALLBACK_THRESHOLD = 0.28;

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
  'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'this', 'that', 'these', 'those'
]);

// Helper: Extracts meaningful token stems from text
function getStemTokens(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Compute fuzzy phrase similarity
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
  const titleScore = (titleOverlap * 0.75) + (titleJaccard * 0.25);

  // Substring or phrase inclusion bonus
  const normA = (titleA || '').toLowerCase().trim();
  const normB = (titleB || '').toLowerCase().trim();
  const phraseBonus = (normA.includes(normB) || normB.includes(normA)) && normA.length > 5 ? 0.35 : 0;

  // Body tokens
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

  // Final score weighted heavily towards title match & phrase bonus
  return Math.min(1.0, (titleScore * 0.70) + (bodyOverlap * 0.20) + phraseBonus);
}

// Convert a text string into a numeric vector using AI API with a timeout
async function generateTextEmbedding(text) {
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
    return result;
  } catch (err) {
    logger.warn(`DuplicateAgent: Embedding API skipped (${err.message}). Using smart NLP similarity fallback.`);
    return [];
  }
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// Detects duplicates against all candidate issues in the repository
export async function detectDuplicate(issue, candidates) {
  const currentText = `${issue.title}\n\n${issue.body}`;
  const issueEmbedding = await generateTextEmbedding(currentText);

  let bestScore = 0;
  let bestNumber = null;
  const useVector = issueEmbedding.length > 0;

  for (const candidate of candidates) {
    let score = 0;

    if (useVector) {
      const candidateEmbedding = await generateTextEmbedding(`${candidate.title}\n\n${candidate.body}`);
      score = cosineSimilarity(issueEmbedding, candidateEmbedding);
    } else {
      score = computeTextSimilarity(issue.title, issue.body, candidate.title, candidate.body);
    }

    if (score > bestScore) {
      bestScore = score;
      bestNumber = candidate.number;
    }
  }

  const threshold = useVector ? VECTOR_THRESHOLD : TEXT_FALLBACK_THRESHOLD;
  const isDuplicate = bestScore >= threshold && candidates.length > 0;

  logger.info(
    `DuplicateAgent: candidatesCount=${candidates.length} best match=#${bestNumber ?? 'none'} score=${bestScore.toFixed(3)} (mode=${useVector ? 'vector' : 'nlp-fallback'}) isDuplicate=${isDuplicate}`,
  );

  return {
    isDuplicate,
    duplicateOfNumber: isDuplicate ? bestNumber : null,
    similarityScore: bestScore,
    issueEmbedding,
  };
}
