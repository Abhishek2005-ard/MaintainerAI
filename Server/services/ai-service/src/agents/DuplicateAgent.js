import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Issues with similarity above this score are considered duplicates.
const DUPLICATE_THRESHOLD = 0.88;

// Helper: Tokenizes text into unique meaningful words (>2 chars)
function getWords(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

// Fallback similarity: computes word overlap ratio between two texts
function textSimilarity(textA, textB) {
  const wordsA = getWords(textA);
  const wordsB = getWords(textB);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let common = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) common++;
  }

  const minSize = Math.min(wordsA.size, wordsB.size);
  const maxSize = Math.max(wordsA.size, wordsB.size);
  const overlapRatio = common / minSize;
  const jaccardRatio = common / (wordsA.size + wordsB.size - common);

  // Weighted score favoring high overlap in smaller text (e.g. titles)
  return (overlapRatio * 0.6) + (jaccardRatio * 0.4);
}

// Convert a text string into a numeric vector using AI API with a timeout
async function generateTextEmbedding(text) {
  let model;

  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.startsWith('AIza')) {
    model = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
  } else if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-')) {
    model = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    });
  }

  if (!model) {
    return [];
  }

  try {
    // 5-second timeout to prevent hanging on invalid keys or network delays
    const result = await Promise.race([
      model.embedQuery(text),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Embedding API timeout')), 5000))
    ]);
    return result;
  } catch (err) {
    logger.warn(`DuplicateAgent: Embedding API skipped (${err.message}). Using text-similarity fallback.`);
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
  const currentText = `${issue.title}\n\n${issue.body}`;
  const issueEmbedding = await generateTextEmbedding(currentText);

  let bestScore = 0;
  let bestNumber = null;
  const useVector = issueEmbedding.length > 0;

  for (const candidate of candidates) {
    const candidateText = `${candidate.title}\n\n${candidate.body}`;
    let score = 0;

    if (useVector) {
      const candidateEmbedding = await generateTextEmbedding(candidateText);
      score = cosineSimilarity(issueEmbedding, candidateEmbedding);
    } else {
      // Fallback text-based similarity
      const titleScore = textSimilarity(issue.title, candidate.title);
      const fullScore = textSimilarity(currentText, candidateText);
      score = (titleScore * 0.6) + (fullScore * 0.4);
    }

    if (score > bestScore) {
      bestScore = score;
      bestNumber = candidate.number;
    }
  }

  // Threshold: 0.85 for vector embeddings, 0.45 for text-similarity fallback
  const threshold = useVector ? DUPLICATE_THRESHOLD : 0.45;
  const isDuplicate = bestScore >= threshold && candidates.length > 0;

  logger.info(
    `DuplicateAgent: best match=#${bestNumber ?? 'none'} score=${bestScore.toFixed(3)} (mode=${useVector ? 'vector' : 'text-fallback'}) isDuplicate=${isDuplicate}`,
  );

  return {
    isDuplicate,
    duplicateOfNumber: isDuplicate ? bestNumber : null,
    similarityScore: bestScore,
    issueEmbedding,
  };
}
