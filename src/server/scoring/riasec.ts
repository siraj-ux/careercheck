import {
  RiasecLetter,
  RIASEC_TIE_BREAK_ORDER,
  RIASEC_TYPES,
} from '@/config/scoring';

export interface RiasecInputItem {
  riasecLetter: RiasecLetter;
  answer: string | number; // '1' to '5'
}

export interface RiasecResult {
  code: string; // e.g. "IAR"
  topLetters: RiasecLetter[];
  scores: Record<RiasecLetter, number>; // 0 to 100 normalized
  rawScores: Record<RiasecLetter, number>;
  headlineInsight: string;
}

/**
 * Headline insight generator based on top RIASEC letters
 */
function generateHeadlineInsight(top3: RiasecLetter[]): string {
  const [first, second, third] = top3;
  const names = `${RIASEC_TYPES[first].name}-${RIASEC_TYPES[second].name}-${RIASEC_TYPES[third].name}`;

  if (first === 'I' && second === 'A') {
    return 'An investigative creator who merges deep analytical inquiry with bold aesthetic design and open-ended exploration.';
  }
  if (first === 'I' && second === 'R') {
    return 'A hands-on systems thinker who excels at reverse-engineering complex machinery, computing architecture, and data pipelines.';
  }
  if (first === 'A' && second === 'S') {
    return 'An empathetic communicator driven to elevate communities through impactful storytelling, human connection, and expressive media.';
  }
  if (first === 'E' && second === 'S') {
    return 'A motivational catalyst who rallies teams, builds consensus, and drives ambitious initiatives toward shared success.';
  }
  if (first === 'E' && second === 'C') {
    return 'A disciplined strategist who thrives at navigating commercial markets, scaling operations, and executing high-stakes goals.';
  }
  if (first === 'R' && second === 'I') {
    return 'A methodical technical builder who grounds theoretical concepts into tangible, high-precision physical and digital systems.';
  }
  if (first === 'C') {
    return 'A structured problem-solver with exceptional fidelity for detail, standard operations, and data integrity.';
  }

  return `A high-potential ${names} profile, combining ${RIASEC_TYPES[first].description.toLowerCase()} with ${RIASEC_TYPES[second].description.toLowerCase()}`;
}

/**
 * Pure scoring function for RIASEC interests
 * Likert 1-5 scale. Range 10-50 per letter (10 items), normalized 0-100.
 * Interest code = top 3 letters. Ties broken by order R, I, A, S, E, C.
 */
export function calculateRiasecScores(items: RiasecInputItem[]): RiasecResult {
  const rawSums: Record<RiasecLetter, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: Record<RiasecLetter, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const item of items) {
    if (rawSums[item.riasecLetter] !== undefined) {
      const val = typeof item.answer === 'number' ? item.answer : parseInt(item.answer, 10);
      if (!isNaN(val)) {
        rawSums[item.riasecLetter] += Math.max(1, Math.min(5, val));
        counts[item.riasecLetter] += 1;
      }
    }
  }

  const scores: Record<RiasecLetter, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const letter of RIASEC_TIE_BREAK_ORDER) {
    const count = counts[letter] || 10;
    const minPossible = count * 1;
    const maxPossible = count * 5;
    const raw = rawSums[letter];

    // Normalize to 0-100
    const normalized = maxPossible > minPossible
      ? Math.round(((raw - minPossible) / (maxPossible - minPossible)) * 100)
      : 50;

    scores[letter] = Math.max(0, Math.min(100, normalized));
  }

  // Sort letters: descending score, with deterministic tie-breaking: R, I, A, S, E, C
  const sortedLetters = [...RIASEC_TIE_BREAK_ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) {
      return scores[b] - scores[a];
    }
    // Tie breaker
    return RIASEC_TIE_BREAK_ORDER.indexOf(a) - RIASEC_TIE_BREAK_ORDER.indexOf(b);
  });

  const top3 = sortedLetters.slice(0, 3);
  const code = top3.join('');
  const headlineInsight = generateHeadlineInsight(top3);

  return {
    code,
    topLetters: top3,
    scores,
    rawScores: rawSums,
    headlineInsight,
  };
}
