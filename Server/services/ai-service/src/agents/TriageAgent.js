import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triagePrompts.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ── Fallback ──────────────────────────────────────────────────────────────────
// Rule-based analysis when no LLM is available.

function fallbackAnalysis(title, body) {
  logger.warn('TriageAgent: no LLM configured — using keyword fallback');

  const text = `${title} ${body}`.toLowerCase();

  const category =
    /bug|error|fail|broken/.test(text)            ? 'bug'     :
    /feature|add|suggest|request/.test(text)      ? 'feature' :
    /how|question|help/.test(text)                ? 'question': 'other';

  const priority =
    /critical|urgent|crash/.test(text) ? 'critical' : 'low';

  const burnoutRisk = /immediately|fix this now|useless|why is this/.test(text);

  return {
    category,
    priority,
    burnoutRisk,
    reasoning: `[Fallback] category=${category}, priority=${priority}`,
  };
}

// Strips markdown code fences the LLM sometimes wraps around JSON.
function stripMarkdown(raw) {
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
}

// ── Main export ───────────────────────────────────────────────────────────────
// Analyzes a GitHub issue and returns structured triage data.

export async function runTriageAgent(title, body) {
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
    return fallbackAnalysis(title, body);
  }

  try {
    // MAKE SURE IT IS OBVIOUS WHERE WE USE THE AI API
    logger.info('TriageAgent: Calling AI API to analyze the issue text...');
    const response = await llm.invoke([
      new SystemMessage(TRIAGE_SYSTEM_PROMPT),
      new HumanMessage(`Title: ${title}\nBody: ${body}`),
    ]);
    logger.info('TriageAgent: AI API responded successfully with issue analysis.');

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = JSON.parse(stripMarkdown(raw));

    return {
      category:    parsed.category    || 'other',
      priority:    parsed.priority    || 'low',
      burnoutRisk: !!parsed.burnoutRisk,
      reasoning:   parsed.reasoning   || '',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`TriageAgent: LLM failed (${msg}) — using fallback`);
    return fallbackAnalysis(title, body);
  }
}
