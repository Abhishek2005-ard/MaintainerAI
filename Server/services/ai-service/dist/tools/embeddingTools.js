import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
// Pick Gemini embeddings over OpenAI if both keys are present
const createEmbeddingModel = () => {
    if (env.GEMINI_API_KEY) {
        return new GoogleGenerativeAIEmbeddings({
            apiKey: env.GEMINI_API_KEY,
            model: 'text-embedding-004',
        });
    }
    if (env.OPENAI_API_KEY) {
        return new OpenAIEmbeddings({
            apiKey: env.OPENAI_API_KEY,
            model: 'text-embedding-3-small',
        });
    }
    return null;
};
// Convert a text string into a numeric vector for similarity comparison
export const generateTextEmbedding = async (text) => {
    const model = createEmbeddingModel();
    if (!model) {
        logger.warn('[Embeddings] No API key configured — returning empty vector. Duplicate detection disabled.');
        return [];
    }
    try {
        return await model.embedQuery(text);
    }
    catch (err) {
        logger.error(`[Embeddings] Failed to generate embedding: ${err.message}`);
        return [];
    }
};
// Cosine similarity between two vectors — returns a score from 0 (different) to 1 (identical)
export const cosineSimilarity = (a, b) => {
    if (a.length === 0 || b.length === 0 || a.length !== b.length)
        return 0;
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    if (magA === 0 || magB === 0)
        return 0;
    return dot / (magA * magB);
};
