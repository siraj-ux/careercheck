import { SpectrumKey, PERSONALITY_SPECTRUMS } from '@/config/scoring';

export interface PersonalityInputItem {
  spectrum: SpectrumKey;
  answer: string | number; // '1' to '5'
  reverseScored?: boolean | number; // 1 or true means reverse scored (6 - answer)
}

export type PersonalityScores = Record<SpectrumKey, number>;

/**
 * Pure scoring function for 5 Neutral Personality Spectrums
 * Handles reverse-scoring and normalizes each spectrum to 0-100.
 * 0 represents the left descriptor; 100 represents the right descriptor.
 * Neither end is framed as good or bad.
 */
export function calculatePersonalityScores(
  items: PersonalityInputItem[]
): PersonalityScores {
  const spectrumSums: Record<SpectrumKey, number> = {
    reserved_outgoing: 0,
    spontaneous_organised: 0,
    practical_imaginative: 0,
    competitive_collaborative: 0,
    calm_sensitive: 0,
  };

  const spectrumCounts: Record<SpectrumKey, number> = {
    reserved_outgoing: 0,
    spontaneous_organised: 0,
    practical_imaginative: 0,
    competitive_collaborative: 0,
    calm_sensitive: 0,
  };

  for (const item of items) {
    if (spectrumSums[item.spectrum] !== undefined) {
      let val = typeof item.answer === 'number' ? item.answer : parseInt(item.answer, 10);
      if (!isNaN(val)) {
        val = Math.max(1, Math.min(5, val));
        const isReversed = Boolean(item.reverseScored);
        const scoredVal = isReversed ? 6 - val : val;

        spectrumSums[item.spectrum] += scoredVal;
        spectrumCounts[item.spectrum] += 1;
      }
    }
  }

  const result: PersonalityScores = {
    reserved_outgoing: 50,
    spontaneous_organised: 50,
    practical_imaginative: 50,
    competitive_collaborative: 50,
    calm_sensitive: 50,
  };

  const keys = Object.keys(PERSONALITY_SPECTRUMS) as SpectrumKey[];

  for (const key of keys) {
    const count = spectrumCounts[key];
    if (count > 0) {
      const minPossible = count * 1;
      const maxPossible = count * 5;
      const raw = spectrumSums[key];
      const normalized = Math.round(((raw - minPossible) / (maxPossible - minPossible)) * 100);
      result[key] = Math.max(0, Math.min(100, normalized));
    }
  }

  return result;
}
