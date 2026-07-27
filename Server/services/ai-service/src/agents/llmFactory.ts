import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../config/env.js';

// Returns the best available LLM — Gemini first, then OpenAI, then null.
// Returns null when no API key is configured (fallback mode activates in each agent).
export function createLLM() {
  if (env.GEMINI_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
      maxOutputTokens: 1024,
    });
  }

  if (env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }

  return null;
}

// Strips markdown code fences the LLM sometimes wraps around JSON.
export function stripMarkdown(raw: string): string {
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
}
