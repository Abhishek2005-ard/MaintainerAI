import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LABEL_PREDICTION_PROMPT } from '../prompts/triagePrompts.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Derives smart labels from the analysis
function smartLabels(analysis) {
  const labels = [
    analysis.category,
    `priority: ${analysis.priority}`,
    ...(analysis.burnoutRisk ? ['burnout-risk'] : []),
  ];
  return { labels, priority: analysis.priority };
}

function stripMarkdown(raw) {
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
}

async function invokeWithTimeout(llm, messages, timeoutMs = 15000) {
  return await Promise.race([
    llm.invoke(messages),
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM call timed out')), timeoutMs))
  ]);
}

// Asks LLMs (Gemini -> OpenAI -> Smart Fallback) to predict GitHub labels based on issue analysis
export async function predictLabels(analysis) {
  const input = JSON.stringify({
    category:    analysis.category,
    priority:    analysis.priority,
    burnoutRisk: analysis.burnoutRisk,
  });
  const messages = [new SystemMessage(LABEL_PREDICTION_PROMPT), new HumanMessage(`Issue analysis:\n${input}`)];

  // 1. Try Gemini
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    try {
      logger.info('LabelAgent: Calling Gemini API for labels...');
      const gemini = new ChatGoogleGenerativeAI({
        apiKey: env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash',
        maxOutputTokens: 1024,
      });
      const response = await invokeWithTimeout(gemini, messages);
      const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const parsed = JSON.parse(stripMarkdown(raw));
      return {
        labels:   parsed.labels   ?? smartLabels(analysis).labels,
        priority: parsed.priority ?? analysis.priority,
      };
    } catch (err) {
      logger.warn(`LabelAgent: Gemini failed (${err.message}) — attempting OpenAI...`);
    }
  }

  // 2. Try OpenAI
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5) {
    try {
      logger.info('LabelAgent: Calling OpenAI API for labels...');
      const openai = new ChatOpenAI({
        apiKey: env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
      });
      const response = await invokeWithTimeout(openai, messages);
      const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const parsed = JSON.parse(stripMarkdown(raw));
      return {
        labels:   parsed.labels   ?? smartLabels(analysis).labels,
        priority: parsed.priority ?? analysis.priority,
      };
    } catch (err) {
      logger.warn(`LabelAgent: OpenAI failed (${err.message}) — using smart labels.`);
    }
  }

  // 3. Fallback Labels
  return smartLabels(analysis);
}
