import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { LABEL_PREDICTION_PROMPT } from '../prompts/triagePrompts.js';
import { createLLM, stripMarkdown } from './llmFactory.js';
import { logger } from '../utils/logger.js';
import type { IssueAnalysis } from '../types/index.js';

export interface LabelResult {
  labels:   string[];
  priority: string;
}

// Derives simple labels from the analysis without calling an LLM.
function fallbackLabels(analysis: IssueAnalysis): LabelResult {
  const labels = [
    analysis.category,
    `priority: ${analysis.priority}`,
    ...(analysis.burnoutRisk ? ['burnout-risk'] : []),
  ];
  return { labels, priority: analysis.priority };
}

// Asks the LLM to suggest GitHub labels based on the issue analysis.
export async function predictLabels(analysis: IssueAnalysis): Promise<LabelResult> {
  const llm = createLLM();
  if (!llm) return fallbackLabels(analysis);

  try {
    const input = JSON.stringify({
      category:    analysis.category,
      priority:    analysis.priority,
      burnoutRisk: analysis.burnoutRisk,
    });

    const response = await llm.invoke([
      new SystemMessage(LABEL_PREDICTION_PROMPT),
      new HumanMessage(`Issue analysis:\n${input}`),
    ]);

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = JSON.parse(stripMarkdown(raw));

    return {
      labels:   parsed.labels   ?? fallbackLabels(analysis).labels,
      priority: parsed.priority ?? analysis.priority,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`LabelAgent: LLM failed (${msg}) — using fallback labels`);
    return fallbackLabels(analysis);
  }
}
