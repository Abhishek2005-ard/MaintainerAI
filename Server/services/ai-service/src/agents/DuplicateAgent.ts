import { generateTextEmbedding, cosineSimilarity } from '../tools/embeddingTools.js';
import { logger } from '../utils/logger.js';
import type { IssuePayload, SimilarIssue } from '../types/index.js';

// Issues with similarity above this score are considered duplicates.
const DUPLICATE_THRESHOLD = 0.88;

export interface DuplicateResult {
  isDuplicate:       boolean;
  duplicateOfNumber: number | null;
  similarityScore:   number;
  issueEmbedding:    number[];
}

// Embeds the incoming issue and compares it against all candidate issues.
// Returns the closest match and whether it exceeds the duplicate threshold.
export async function detectDuplicate(
  issue:      IssuePayload,
  candidates: SimilarIssue[],
): Promise<DuplicateResult> {
  const issueEmbedding = await generateTextEmbedding(`${issue.title}\n\n${issue.body}`);

  // If we couldn't generate an embedding, skip duplicate detection entirely.
  if (issueEmbedding.length === 0) {
    logger.warn('DuplicateAgent: no embedding available — skipping duplicate detection');
    return { isDuplicate: false, duplicateOfNumber: null, similarityScore: 0, issueEmbedding: [] };
  }

  let bestScore  = 0;
  let bestNumber: number | null = null;

  for (const candidate of candidates) {
    const candidateEmbedding = await generateTextEmbedding(`${candidate.title}\n\n${candidate.body}`);
    const score = cosineSimilarity(issueEmbedding, candidateEmbedding);

    if (score > bestScore) {
      bestScore  = score;
      bestNumber = candidate.number;
    }
  }

  const isDuplicate = bestScore >= DUPLICATE_THRESHOLD;
  logger.info(
    `DuplicateAgent: best match=#${bestNumber ?? 'none'} score=${bestScore.toFixed(3)} isDuplicate=${isDuplicate}`,
  );

  return {
    isDuplicate,
    duplicateOfNumber: isDuplicate ? bestNumber : null,
    similarityScore:   bestScore,
    issueEmbedding,
  };
}
