import { describe, it, expect } from 'vitest';

// Simple unit tests for triage heuristic categorization logic
function smartHeuristicAnalysis(title, body) {
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

  return { category, priority, burnoutRisk };
}

describe('AI Service - Smart Heuristic Fallback', () => {
  it('should categorize crash reports as bugs with high/medium priority', () => {
    const result = smartHeuristicAnalysis('App crashes on click', 'Uncaught TypeError on button submission');
    expect(result.category).toBe('bug');
    expect(result.priority).toBe('high');
    expect(result.burnoutRisk).toBe(false);
  });

  it('should detect critical vulnerabilities', () => {
    const result = smartHeuristicAnalysis('Security vulnerability in auth', 'Critical data loss exploit on production endpoint');
    expect(result.category).toBe('bug');
    expect(result.priority).toBe('critical');
  });

  it('should detect feature requests', () => {
    const result = smartHeuristicAnalysis('Feature Request: Dark mode', 'Please add option to enable dark mode setting');
    expect(result.category).toBe('feature');
  });

  it('should flag burnout risk from toxic language', () => {
    const result = smartHeuristicAnalysis('Useless app', 'Why is this broken, fix this now stupid code');
    expect(result.burnoutRisk).toBe(true);
  });
});
