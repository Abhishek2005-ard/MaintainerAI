import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { generateTextEmbedding, cosineSimilarity } from './embeddingTools.js';
import { env } from '../config/env.js';
const getLLM = () => {
    if (env.GEMINI_API_KEY)
        return new ChatGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY, model: 'gemini-2.0-flash' });
    if (env.OPENAI_API_KEY)
        return new ChatOpenAI({ apiKey: env.OPENAI_API_KEY, modelName: 'gpt-4o-mini', temperature: 0 });
    return null;
};
// Helper — invoke LLM with a system + user message and return the text response
const callLLM = async (system, user) => {
    const llm = getLLM();
    if (!llm)
        return 'No LLM configured';
    const res = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);
    return typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
};
// Tool 1 — generate a numeric embedding vector for a piece of text
export const generateEmbeddingTool = tool(async ({ text }) => {
    const embedding = await generateTextEmbedding(text);
    return embedding.length ? JSON.stringify(embedding) : 'No embedding model configured';
}, {
    name: 'generate_embedding',
    description: 'Generate a numeric embedding vector for a text string',
    schema: z.object({
        text: z.string().describe('Text to embed'),
    }),
});
// Tool 2 — find the most semantically similar candidates to a query
export const semanticSearchTool = tool(async ({ query, candidates }) => {
    const queryEmb = await generateTextEmbedding(query);
    if (!queryEmb.length)
        return '[]';
    const scored = await Promise.all(candidates.map(async (c) => {
        const emb = await generateTextEmbedding(c.text);
        const score = cosineSimilarity(queryEmb, emb);
        return { id: c.id, text: c.text, score: parseFloat(score.toFixed(4)) };
    }));
    scored.sort((a, b) => b.score - a.score);
    return JSON.stringify(scored);
}, {
    name: 'semantic_search',
    description: 'Rank a list of candidate texts by semantic similarity to a query',
    schema: z.object({
        query: z.string().describe('Search query'),
        candidates: z.array(z.object({
            id: z.string().describe('Unique identifier for this candidate'),
            text: z.string().describe('Candidate text to compare'),
        })).describe('Texts to rank by similarity'),
    }),
});
// Tool 3 — classify an issue into bug / feature / question / other
export const classifyIssueTool = tool(async ({ title, body }) => callLLM('Classify this GitHub issue into exactly one of: bug, feature, question, other. Return only the category word.', `Title: ${title}\nBody: ${body}`), {
    name: 'classify_issue',
    description: 'Classify a GitHub issue as: bug, feature, question, or other',
    schema: z.object({
        title: z.string().describe('Issue title'),
        body: z.string().describe('Issue body'),
    }),
});
// Tool 4 — predict GitHub labels for an issue
export const predictLabelsTool = tool(async ({ title, body, category }) => callLLM('Suggest GitHub labels for this issue. Return a JSON array of label name strings only. No markdown.', `Title: ${title}\nBody: ${body}\nCategory: ${category}`), {
    name: 'predict_labels',
    description: 'Predict appropriate GitHub labels for an issue',
    schema: z.object({
        title: z.string().describe('Issue title'),
        body: z.string().describe('Issue body'),
        category: z.string().describe('Issue category (bug/feature/question/other)'),
    }),
});
// Tool 5 — assign a priority level to an issue
export const assignPriorityTool = tool(async ({ title, body }) => callLLM('Assign a priority to this GitHub issue. Return exactly one of: low, medium, high, critical. No extra text.', `Title: ${title}\nBody: ${body}`), {
    name: 'assign_priority',
    description: 'Assign a priority level (low/medium/high/critical) to a GitHub issue',
    schema: z.object({
        title: z.string().describe('Issue title'),
        body: z.string().describe('Issue body'),
    }),
});
// Tool 6 — write a short summary of an issue
export const summarizeIssueTool = tool(async ({ title, body }) => callLLM('Write a concise 1-2 sentence summary of this GitHub issue. Be specific and factual.', `Title: ${title}\nBody: ${body}`), {
    name: 'summarize_issue',
    description: 'Generate a short, factual summary of a GitHub issue',
    schema: z.object({
        title: z.string().describe('Issue title'),
        body: z.string().describe('Issue body'),
    }),
});
// All AI tools bundled — use with llm.bindTools(aiAgentTools)
export const aiAgentTools = [
    generateEmbeddingTool,
    semanticSearchTool,
    classifyIssueTool,
    predictLabelsTool,
    assignPriorityTool,
    summarizeIssueTool,
];
