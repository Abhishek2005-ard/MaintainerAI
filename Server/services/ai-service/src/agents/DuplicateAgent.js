import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Issues with similarity above this score are considered duplicates.
const DUPLICATE_THRESHOLD = 0.88;

// Convert a text string into a numeric vector using AI API directly
async function generateTextEmbedding(text) {
  let model;

  // We instantiate the AI model directly in the agent so there is no separate state
  if (env.GEMINI_API_KEY) {
    model = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
  } else if (env.OPENAI_API_KEY) {
    model = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    });
  }

  if (!model) {
    logger.warn('DuplicateAgent: No API key configured — returning empty vector. Duplicate detection disabled.');
    return [];
  }

  try {
    // MAKE SURE IT IS OBVIOUS WHERE WE USE THE AI API
    logger.info('DuplicateAgent: Calling AI API to generate text embeddings...');
    const result = await model.embedQuery(text);
    logger.info('DuplicateAgent: AI API responded successfully with embeddings.');
    return result;
  } catch (err) {
    logger.error(`DuplicateAgent: Failed to generate embedding: ${err.message}`);
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

// Embeds the incoming issue and compares it against all candidate issues.
// Returns the closest match and whether it exceeds the duplicate threshold.
export async function detectDuplicate(issue, candidates) {
  const issueEmbedding = await generateTextEmbedding(`${issue.title}\n\n${issue.body}`);

  // If we couldn't generate an embedding, skip duplicate detection entirely.
  if (issueEmbedding.length === 0) {
    logger.warn('DuplicateAgent: no embedding available — skipping duplicate detection');
    return { isDuplicate: false, duplicateOfNumber: null, similarityScore: 0, issueEmbedding: [] };
  }

  let bestScore  = 0;
  let bestNumber = null;

  for (const candidate of candidates) {
    const candidateEmbedding = await generateTextEmbedding(`${candidate.title}\n\n${candidate.body}`);
    const score = cosineSimilarity(issueEmbedding, candidateEmbedding);

    if (score > bestScore) {
      bestScore  = score;
      bestNumber = candidate.number;
    }
  }

  const isDuplicate = bestScore >= DUPLICATE_THRESHOLD;
  logger.info(
    `DuplicateAgent: best match=#${bestNumber ?? 'none'} score=${bestScore.toFixed(3)} isDuplicate=${isDuplicate}`,
  );

  return {
    isDuplicate,
    duplicateOfNumber: isDuplicate ? bestNumber : null,
    similarityScore:   bestScore,
    issueEmbedding,
  };
}
