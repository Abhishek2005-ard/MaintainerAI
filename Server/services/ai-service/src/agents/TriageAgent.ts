import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { env } from '../config/env.js';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triagePrompts.js';
import { logger } from '../utils/logger.js';
import { IssueAnalysis } from '../graph/state.js';

// Helper to select and initialize the appropriate LLM
const getModel = () => {
  if (env.GEMINI_API_KEY) {
    logger.info('Initializing ChatGoogleGenerativeAI (Gemini) model...');
    return new ChatGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash',
      maxOutputTokens: 1024,
    });
  } else if (env.OPENAI_API_KEY) {
    logger.info('Initializing ChatOpenAI model...');
    return new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }
  return null;
};

/**
 * Fallback static analyzer when no LLM API keys are provided.
 * Useful for local testing/mocking.
 */
const runFallbackAnalysis = (title: string, body: string): IssueAnalysis => {
  logger.warn('No LLM API keys configured. Running local rules-based fallback analysis.');
  
  const content = `${title} ${body}`.toLowerCase();
  
  let category: 'bug' | 'feature' | 'question' | 'other' = 'other';
  if (content.includes('bug') || content.includes('error') || content.includes('fail') || content.includes('broken')) {
    category = 'bug';
  } else if (content.includes('feature') || content.includes('add') || content.includes('suggest') || content.includes('request')) {
    category = 'feature';
  } else if (content.includes('how') || content.includes('question') || content.includes('help')) {
    category = 'question';
  }

  const priority = content.includes('critical') || content.includes('urgent') || content.includes('crash') ? 'critical' : 'low';
  
  // Burnout check based on demanding words/capital letters/exclamations
  const isDemanding = content.includes('immediately') || content.includes('now') || content.includes('fix this') || content.includes('useless');
  const burnoutRisk = isDemanding;

  return {
    category,
    priority,
    burnoutRisk,
    reasoning: `Static rule analysis: category=${category}, priority=${priority}, burnoutRisk=${burnoutRisk}`
  };
};

/**
 * Invokes the AI model or fallback ruleset to analyze the issue text.
 */
export const runTriageAgent = async (title: string, body: string): Promise<IssueAnalysis> => {
  const model = getModel();
  if (!model) {
    return runFallbackAnalysis(title, body);
  }

  try {
    const response = await model.invoke([
      new SystemMessage(TRIAGE_SYSTEM_PROMPT),
      new HumanMessage(`Analyze the following issue:\nTitle: ${title}\nBody: ${body}`)
    ]);

    const resContent = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Clean JSON parsing (removing markdown backticks if any)
    const jsonStr = resContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      category: parsed.category || 'other',
      priority: parsed.priority || 'low',
      burnoutRisk: !!parsed.burnoutRisk,
      reasoning: parsed.reasoning || 'No explanation provided.'
    };
  } catch (err: any) {
    logger.error(`Error in Triage Agent LLM execution: ${err.message}`);
    return runFallbackAnalysis(title, body);
  }
};
