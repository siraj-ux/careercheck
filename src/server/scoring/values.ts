export interface ValuesInputItem {
  valueKey: string;
  answer: string | number; // 1 to 5
}

export interface ValuesResult {
  topValues: string[];
  scores: Record<string, number>;
}

/**
 * Pure scoring function for Work & Life Values
 * Identifies top 3 core values ranked by priority score.
 */
export function calculateValuesScores(items: ValuesInputItem[]): ValuesResult {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const item of items) {
    if (!item.valueKey) continue;
    const key = item.valueKey.trim();
    const val = typeof item.answer === 'number' ? item.answer : parseInt(item.answer, 10);
    if (!isNaN(val)) {
      sums[key] = (sums[key] || 0) + Math.max(1, Math.min(5, val));
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  const scores: Record<string, number> = {};
  for (const [key, sum] of Object.entries(sums)) {
    const count = counts[key] || 1;
    scores[key] = Math.round((sum / (count * 5)) * 100);
  }

  // Sort descending by score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topValues = sorted.slice(0, 3).map(([key]) => key);

  return {
    topValues,
    scores,
  };
}
