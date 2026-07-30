import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

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
    logger.warn('aiAgentTools: No API key configured — returning empty vector.');
    return [];
  }

  try {
    // MAKE SURE IT IS OBVIOUS WHERE WE USE THE AI API
    logger.info('aiAgentTools: Calling AI API to generate embeddings...');
    const result = await model.embedQuery(text);
    logger.info('aiAgentTools: AI API responded successfully with embeddings.');
    return result;
  } catch (err) {
    logger.error(`aiAgentTools: Failed to generate embedding: ${err.message}`);
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

// Helper — invoke LLM with a system + user message and return the text response
const callLLM = async (system, user) => {
  let llm;
  
  // Create the LLM instance directly here when needed
  if (env.GEMINI_API_KEY) {
    llm = new ChatGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY, model: 'gemini-2.0-flash' });
  } else if (env.OPENAI_API_KEY) {
    llm = new ChatOpenAI({ apiKey: env.OPENAI_API_KEY, modelName: 'gpt-4o-mini', temperature: 0 });
  }

  if (!llm) return 'No LLM configured';
  
  try {
    // MAKE SURE IT IS OBVIOUS WHERE WE USE THE AI API
    logger.info('aiAgentTools: Calling AI API to answer query...');
    const res = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);
    logger.info('aiAgentTools: AI API responded successfully.');
    
    return typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
  } catch (err) {
    logger.error(`aiAgentTools: Failed to invoke LLM: ${err.message}`);
    return `Error: LLM invocation failed - ${err.message}`;
  }
};

// Tool 1 — generate a numeric embedding vector for a piece of text
export const generateEmbeddingTool = tool(
  async ({ text }) => {
    const embedding = await generateTextEmbedding(text);
    return embedding.length ? JSON.stringify(embedding) : 'No embedding model configured';
  },
  {
    name: 'generate_embedding',
    description: 'Generate a numeric embedding vector for a text string',
    schema: z.object({
      text: z.string().describe('Text to embed'),
    }),
  }
);

// Tool 2 — find the most semantically similar candidates to a query
export const semanticSearchTool = tool(
  async ({ query, candidates }) => {
    const queryEmb = await generateTextEmbedding(query);
    if (!queryEmb.length) return '[]';

    const scored = await Promise.all(
      candidates.map(async (c) => {
        const emb   = await generateTextEmbedding(c.text);
        const score = cosineSimilarity(queryEmb, emb);
        return { id: c.id, text: c.text, score: parseFloat(score.toFixed(4)) };
      })
    );

    scored.sort((a, b) => b.score - a.score);
    return JSON.stringify(scored);
  },
  {
    name: 'semantic_search',
    description: 'Rank a list of candidate texts by semantic similarity to a query',
    schema: z.object({
      query:      z.string().describe('Search query'),
      candidates: z.array(z.object({
        id:   z.string().describe('Unique identifier for this candidate'),
        text: z.string().describe('Candidate text to compare'),
      })).describe('Texts to rank by similarity'),
    }),
  }
);

// Tool 3 — classify an issue into bug / feature / question / other
export const classifyIssueTool = tool(
  async ({ title, body }) => callLLM(
    'Classify this GitHub issue into exactly one of: bug, feature, question, other. Return only the category word.',
    `Title: ${title}\nBody: ${body}`
  ),
  {
    name: 'classify_issue',
    description: 'Classify a GitHub issue as: bug, feature, question, or other',
    schema: z.object({
      title: z.string().describe('Issue title'),
      body:  z.string().describe('Issue body'),
    }),
  }
);

// Tool 4 — predict GitHub labels for an issue
export const predictLabelsTool = tool(
  async ({ title, body, category }) => callLLM(
    'Suggest GitHub labels for this issue. Return a JSON array of label name strings only. No markdown.',
    `Title: ${title}\nBody: ${body}\nCategory: ${category}`
  ),
  {
    name: 'predict_labels',
    description: 'Predict appropriate GitHub labels for an issue',
    schema: z.object({
      title:    z.string().describe('Issue title'),
      body:     z.string().describe('Issue body'),
      category: z.string().describe('Issue category (bug/feature/question/other)'),
    }),
  }
);

// Tool 5 — assign a priority level to an issue
export const assignPriorityTool = tool(
  async ({ title, body }) => callLLM(
    'Assign a priority to this GitHub issue. Return exactly one of: low, medium, high, critical. No extra text.',
    `Title: ${title}\nBody: ${body}`
  ),
  {
    name: 'assign_priority',
    description: 'Assign a priority level (low/medium/high/critical) to a GitHub issue',
    schema: z.object({
      title: z.string().describe('Issue title'),
      body:  z.string().describe('Issue body'),
    }),
  }
);

// Tool 6 — write a short summary of an issue
export const summarizeIssueTool = tool(
  async ({ title, body }) => callLLM(
    'Write a concise 1-2 sentence summary of this GitHub issue. Be specific and factual.',
    `Title: ${title}\nBody: ${body}`
  ),
  {
    name: 'summarize_issue',
    description: 'Generate a short, factual summary of a GitHub issue',
    schema: z.object({
      title: z.string().describe('Issue title'),
      body:  z.string().describe('Issue body'),
    }),
  }
);

// All AI tools bundled — use with llm.bindTools(aiAgentTools)
export const aiAgentTools = [
  generateEmbeddingTool,
  semanticSearchTool,
  classifyIssueTool,
  predictLabelsTool,
  assignPriorityTool,
  summarizeIssueTool,
];
