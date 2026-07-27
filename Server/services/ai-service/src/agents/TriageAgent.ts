import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/triagePrompts.js';
import { createLLM, stripMarkdown } from './llmFactory.js';
import { logger } from '../utils/logger.js';
import type { IssueAnalysis } from '../types/index.js';

// ── Fallback ──────────────────────────────────────────────────────────────────
// Rule-based analysis when no LLM is available.

function fallbackAnalysis(title: string, body: string): IssueAnalysis {
  logger.warn('TriageAgent: no LLM configured — using keyword fallback');

  const text = `${title} ${body}`.toLowerCase();

  const category: IssueAnalysis['category'] =
    /bug|error|fail|broken/.test(text)            ? 'bug'     :
    /feature|add|suggest|request/.test(text)      ? 'feature' :
    /how|question|help/.test(text)                ? 'question': 'other';

  const priority: IssueAnalysis['priority'] =
    /critical|urgent|crash/.test(text) ? 'critical' : 'low';

  const burnoutRisk = /immediately|fix this now|useless|why is this/.test(text);

  return {
    category,
    priority,
    burnoutRisk,
    reasoning: `[Fallback] category=${category}, priority=${priority}`,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
// Analyzes a GitHub issue and returns structured triage data.

export async function runTriageAgent(title: string, body: string): Promise<IssueAnalysis> {
  const llm = createLLM();
  if (!llm) return fallbackAnalysis(title, body);

  try {
    const response = await llm.invoke([
      new SystemMessage(TRIAGE_SYSTEM_PROMPT),
      new HumanMessage(`Title: ${title}\nBody: ${body}`),
    ]);

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`TriageAgent: LLM failed (${msg}) — using fallback`);
    return fallbackAnalysis(title, body);
  }
}
