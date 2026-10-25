import { AptitudeSubType } from '@/config/scoring';

export interface AptitudeInputItem {
  subType: AptitudeSubType;
  userAnswer?: string | null;
  correctKey: string; // From the question bank (server-only)
}

export interface AptitudeScores {
  logical: number; // 0 to 100
  verbal: number; // 0 to 100
  spatial: number; // 0 to 100
  overall: number; // 0 to 100
  breakdown: {
    logical: { correct: number; total: number };
    verbal: { correct: number; total: number };
    spatial: { correct: number; total: number };
  };
}

/**
 * Pure scoring function for Aptitude
 * Calculates percentage correct for Logical, Verbal, and Spatial,
 * and the arithmetic mean across the three sub-types.
 */
export function calculateAptitudeScores(items: AptitudeInputItem[]): AptitudeScores {
  const counts: Record<AptitudeSubType, { correct: number; total: number }> = {
    logical: { correct: 0, total: 0 },
    verbal: { correct: 0, total: 0 },
    spatial: { correct: 0, total: 0 },
  };

  for (const item of items) {
    const subType = item.subType;
    if (counts[subType]) {
      counts[subType].total += 1;
      const isCorrect =
        item.userAnswer &&
        item.userAnswer.trim().toUpperCase() === item.correctKey.trim().toUpperCase();
      if (isCorrect) {
        counts[subType].correct += 1;
      }
    }
  }

  const calcPercent = (type: AptitudeSubType): number => {
    const { correct, total } = counts[type];
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const logical = calcPercent('logical');
  const verbal = calcPercent('verbal');
  const spatial = calcPercent('spatial');
  const overall = Math.round((logical + verbal + spatial) / 3);

  return {
    logical,
    verbal,
    spatial,
    overall,
    breakdown: counts,
  };
}
