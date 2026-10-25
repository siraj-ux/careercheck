/**
 * Scoring Configuration for CareerChecks
 * Keeps all algorithms and numerical thresholds in readable configuration.
 * Adheres to docs/product.md Section 9.4
 */

export type RiasecLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecMeta {
  letter: RiasecLetter;
  name: string;
  description: string;
  color: string;
}

export const RIASEC_TYPES: Record<RiasecLetter, RiasecMeta> = {
  R: {
    letter: 'R',
    name: 'Realistic',
    description: 'Hands-on, practical problem solvers who like tangible tools, building, and physical systems.',
    color: '#0284c7', // Sky
  },
  I: {
    letter: 'I',
    name: 'Investigative',
    description: 'Analytical thinkers who excel at deep inquiry, mathematical puzzles, and data-driven insights.',
    color: '#4f46e5', // Indigo
  },
  A: {
    letter: 'A',
    name: 'Artistic',
    description: 'Creative, intuitive minds driven by self-expression, modern aesthetics, and open-ended design.',
    color: '#9333ea', // Purple
  },
  S: {
    letter: 'S',
    name: 'Social',
    description: 'Empathetic mentors and helpers dedicated to teaching, team harmony, and human growth.',
    color: '#059669', // Emerald
  },
  E: {
    letter: 'E',
    name: 'Enterprising',
    description: 'Persuasive catalysts and leaders motivated by venture growth, public influence, and milestones.',
    color: '#ea580c', // Orange
  },
  C: {
    letter: 'C',
    name: 'Conventional',
    description: 'Methodical organizers focused on precision, structured workflows, and data accuracy.',
    color: '#475569', // Slate
  },
};

/**
 * RIASEC tie-breaking order strictly as defined in docs/product.md:
 * "Ties broken by the order R, I, A, S, E, C."
 */
export const RIASEC_TIE_BREAK_ORDER: RiasecLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export type AptitudeSubType = 'logical' | 'verbal' | 'spatial';

export const APTITUDE_SUBTYPES: Record<AptitudeSubType, { name: string; description: string }> = {
  logical: {
    name: 'Logical Reasoning',
    description: 'Pattern recognition, deduplication of rules, and algorithmic deduction.',
  },
  verbal: {
    name: 'Verbal Reasoning',
    description: 'Textual comprehension, vocabulary nuances, and deductive reading.',
  },
  spatial: {
    name: 'Spatial & Visual',
    description: 'Mental rotation, 3D structure interpretation, and geometric awareness.',
  },
};

export type SpectrumKey =
  | 'reserved_outgoing'
  | 'spontaneous_organised'
  | 'practical_imaginative'
  | 'competitive_collaborative'
  | 'calm_sensitive';

export interface SpectrumMeta {
  key: SpectrumKey;
  leftLabel: string;
  rightLabel: string;
  leftDesc: string;
  rightDesc: string;
}

/**
 * 5 Neutral Personality Spectrums
 * Deliberately without good/bad color-coding. Both ends are valued strengths.
 */
export const PERSONALITY_SPECTRUMS: Record<SpectrumKey, SpectrumMeta> = {
  reserved_outgoing: {
    key: 'reserved_outgoing',
    leftLabel: 'Reserved',
    rightLabel: 'Outgoing',
    leftDesc: 'Values deep quiet focus, independent reflection, and thoughtful 1-on-1 dialogue.',
    rightDesc: 'Draws high energy from lively teams, group brainstorming, and frequent communication.',
  },
  spontaneous_organised: {
    key: 'spontaneous_organised',
    leftLabel: 'Spontaneous',
    rightLabel: 'Organised',
    leftDesc: 'Thrives in fluid, fast-changing setups; adapts quickly without needing fixed plans.',
    rightDesc: 'Excels with methodical workflows, structured checklists, and planned timelines.',
  },
  practical_imaginative: {
    key: 'practical_imaginative',
    leftLabel: 'Practical',
    rightLabel: 'Imaginative',
    leftDesc: 'Grounded in concrete reality, proven techniques, and pragmatic real-world solutions.',
    rightDesc: 'Fascinated by bold possibilities, experimental theories, and unconventional horizons.',
  },
  competitive_collaborative: {
    key: 'competitive_collaborative',
    leftLabel: 'Competitive',
    rightLabel: 'Collaborative',
    leftDesc: 'Driven by individual achievement, personal benchmarks, and high-performance stakes.',
    rightDesc: 'Energised by collective consensus, mutual encouragement, and shared team wins.',
  },
  calm_sensitive: {
    key: 'calm_sensitive',
    leftLabel: 'Calm',
    rightLabel: 'Sensitive',
    leftDesc: 'Steadfast under immediate pressure; remains emotionally composed in uncertain conditions.',
    rightDesc: 'Attuned to subtle emotional undercurrents, team climate, and empathetic nuances.',
  },
};

/**
 * Values key options
 */
export const VALUE_KEYS = [
  'Creativity',
  'Stability',
  'Independence',
  'Impact',
  'Income',
  'Leadership',
  'Continuous Learning',
  'Work-Life Balance',
] as const;

export type ValueKey = (typeof VALUE_KEYS)[number];

/**
 * Scoring formula weights from docs/product.md Section 9.4
 * fit = 0.50 * interest_match + 0.30 * aptitude_match + 0.20 * personality_values_match
 */
export const SCORING_WEIGHTS = {
  interest: 0.5,
  aptitude: 0.3,
  personalityValues: 0.2,
};

/**
 * College Matching Thresholds
 */
export const COLLEGE_MATCHING_RULES = {
  safeMargin: 5, // marks >= cutoff + 5
  targetMargin: 5, // within cutoff ± 5
  reachMarginMax: 15, // cutoff - 15 <= marks < cutoff - 5
  loanBudgetMultiplier: 1.3, // Allow up to +30% budget if open to loan
  maxCollegesPerCategory: 5,
  disclaimer: 'Guidance, not a verdict. Cutoffs and admission criteria change annually.',
};
