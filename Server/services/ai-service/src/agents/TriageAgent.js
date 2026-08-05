import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triagePrompts.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function smartHeuristicAnalysis(title, body) {
  logger.warn('TriageAgent: using local text analysis fallback');

  const text = `${title} \n ${body}`.toLowerCase();

  let category = 'other';
  if (/bug|error|fail|broken|crash|exception|freeze|unexpected|not working|cannot|unable|issue|vulnerability|security|exploit|304|500|404|403|syntaxerror|typeerror|undefined|null/.test(text)) {
    category = 'bug';
  } else if (/feature|add|suggest|request|support|allow|enable|option|setting|enhance|upgrade|new/.test(text)) {
    category = 'feature';
  } else if (/how|question|where|why|help|explain|docs|documentation|setup|configure/.test(text)) {
    category = 'question';
  }

  let priority = 'low';
  if (/critical|urgent|vulnerability|security|exploit|production|data loss|corrupt|blocker|fatal/.test(text)) {
    priority = 'critical';
  } else if (/high|major|severe|crash|freeze|cannot login|auth fail|cannot submit|payment|broken flow/.test(text)) {
    priority = 'high';
  } else if (/medium|normal|incorrect|alignment|style|typo|slow|delay/.test(text) || category === 'bug') {
    priority = 'medium';
  }

  const burnoutRisk = /immediately|fix this now|useless|why is this|stupid|worst|garbage|solve this|fix it|unacceptable|lazy/.test(text);

  const reasoning = `Categorized as [${category}] with [${priority}] priority based on issue content.`;

  return {
    category,
    priority,
    burnoutRisk,
    reasoning,
  };
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

/**
 * Analyzes issue content using artificial intelligence models or local text analysis fallback.
 */
export async function runTriageAgent(title, body, customHints = null) {
  const userContent = customHints
    ? `Title: ${title}\nBody: ${body}\n\nAdditional triage guidelines:\n${customHints}`
    : `Title: ${title}\nBody: ${body}`;
  const messages = [new SystemMessage(TRIAGE_SYSTEM_PROMPT), new HumanMessage(userContent)];

  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    try {
      logger.info('TriageAgent: Calling Gemini API...');
      const gemini = new ChatGoogleGenerativeAI({
        apiKey: env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash',
        maxOutputTokens: 1024,
      });
      const response = await invokeWithTimeout(gemini, messages);
      const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const parsed = JSON.parse(stripMarkdown(raw));
      return {
        category:    parsed.category    || 'other',
        priority:    parsed.priority    || 'low',
        burnoutRisk: !!parsed.burnoutRisk,
        reasoning:   parsed.reasoning   || '',
      };
    } catch (err) {
      logger.warn(`TriageAgent: Gemini API failed (${err.message}). Trying OpenAI fallback...`);
    }
  }

  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5) {
    try {
      logger.info('TriageAgent: Calling OpenAI API...');
      const openai = new ChatOpenAI({
        apiKey: env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
      });
      const response = await invokeWithTimeout(openai, messages);
      const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const parsed = JSON.parse(stripMarkdown(raw));
      return {
        category:    parsed.category    || 'other',
        priority:    parsed.priority    || 'low',
        burnoutRisk: !!parsed.burnoutRisk,
        reasoning:   parsed.reasoning   || '',
      };
    } catch (err) {
      logger.warn(`TriageAgent: OpenAI API failed (${err.message}). Using local text analysis.`);
    }
  }

  return smartHeuristicAnalysis(title, body);
}

