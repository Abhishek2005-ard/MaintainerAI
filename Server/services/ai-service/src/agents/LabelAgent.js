import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LABEL_PREDICTION_PROMPT } from '../prompts/triagePrompts.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Derives simple labels from the analysis without calling an LLM.
function fallbackLabels(analysis) {
  const labels = [
    analysis.category,
    `priority: ${analysis.priority}`,
    ...(analysis.burnoutRisk ? ['burnout-risk'] : []),
  ];
  return { labels, priority: analysis.priority };
}

// Strips markdown code fences the LLM sometimes wraps around JSON.
function stripMarkdown(raw) {
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
}

// Asks the LLM to suggest GitHub labels based on the issue analysis.
export async function predictLabels(analysis) {
  let llm;
  
  // We instantiate the AI model directly in the agent so there is no separate state
  if (env.GEMINI_API_KEY) {
    llm = new ChatGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
      maxOutputTokens: 1024,
    });
  } else if (env.OPENAI_API_KEY) {
    llm = new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }

  if (!llm) {
    logger.warn('LabelAgent: No API key configured — using fallback labels');
    return fallbackLabels(analysis);
  }

  try {
    const input = JSON.stringify({
      category:    analysis.category,
      priority:    analysis.priority,
      burnoutRisk: analysis.burnoutRisk,
    });

    // MAKE SURE IT IS OBVIOUS WHERE WE USE THE AI API
    logger.info('LabelAgent: Calling AI API to predict labels based on issue analysis...');
    const response = await llm.invoke([
      new SystemMessage(LABEL_PREDICTION_PROMPT),
      new HumanMessage(`Issue analysis:\n${input}`),
    ]);
    logger.info('LabelAgent: AI API responded successfully with labels.');

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = JSON.parse(stripMarkdown(raw));

    return {
      labels:   parsed.labels   ?? fallbackLabels(analysis).labels,
      priority: parsed.priority ?? analysis.priority,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`LabelAgent: LLM failed (${msg}) — using fallback labels`);
    return fallbackLabels(analysis);
  }
}
