import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { env } from '../config/env.js';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triagePrompts.js';
import { logger } from '../utils/logger.js';
// Pick Gemini over OpenAI if both keys are present
const createModel = () => {
    if (env.GEMINI_API_KEY) {
        logger.info('[TriageAgent] Using Gemini (gemini-2.0-flash)');
        return new ChatGoogleGenerativeAI({
            apiKey: env.GEMINI_API_KEY,
            model: 'gemini-2.0-flash',
            maxOutputTokens: 1024,
        });
    }
    if (env.OPENAI_API_KEY) {
        logger.info('[TriageAgent] Using OpenAI (gpt-4o-mini)');
        return new ChatOpenAI({
            apiKey: env.OPENAI_API_KEY,
            modelName: 'gpt-4o-mini',
            temperature: 0.1,
        });
    }
    return null;
};
// Strip markdown code fences the LLM sometimes wraps around JSON
const parseLLMResponse = (rawContent) => {
    const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
        category: parsed.category || 'other',
        priority: parsed.priority || 'low',
        burnoutRisk: !!parsed.burnoutRisk,
        reasoning: parsed.reasoning || 'No reasoning provided.',
    };
};
// Simple keyword-based fallback when no LLM is configured
const runFallbackAnalysis = (title, body) => {
    logger.warn('[TriageAgent] No LLM key configured — using rule-based fallback.');
    const text = `${title} ${body}`.toLowerCase();
    let category = 'other';
    if (text.includes('bug') || text.includes('error') || text.includes('fail') || text.includes('broken')) {
        category = 'bug';
    }
    else if (text.includes('feature') || text.includes('add') || text.includes('suggest') || text.includes('request')) {
        category = 'feature';
    }
    else if (text.includes('how') || text.includes('question') || text.includes('help')) {
        category = 'question';
    }
    const priority = text.includes('critical') || text.includes('urgent') || text.includes('crash') ? 'critical' : 'low';
    const burnoutRisk = text.includes('immediately') ||
        text.includes('fix this now') ||
        text.includes('useless') ||
        text.includes('why is this');
    return {
        category,
        priority,
        burnoutRisk,
        reasoning: `[Fallback] category=${category}, priority=${priority}, burnoutRisk=${burnoutRisk}`,
    };
};
// Main export — uses LLM if available, otherwise falls back to rules
export const runTriageAgent = async (title, body) => {
    const model = createModel();
    if (!model)
        return runFallbackAnalysis(title, body);
    try {
        const response = await model.invoke([
            new SystemMessage(TRIAGE_SYSTEM_PROMPT),
            new HumanMessage(`Analyze the following GitHub issue:\nTitle: ${title}\nBody: ${body}`),
        ]);
        const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        return parseLLMResponse(rawContent);
    }
    catch (err) {
        logger.error(`[TriageAgent] LLM call failed: ${err.message} — falling back to rules.`);
        return runFallbackAnalysis(title, body);
    }
};
