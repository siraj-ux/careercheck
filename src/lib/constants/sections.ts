export const SECTION_ORDER_UG = ['interests', 'aptitude', 'personality', 'values'] as const;
export const SECTION_ORDER_PG = ['interests', 'aptitude', 'personality', 'values', 'domain'] as const;

export type SectionType = 'interests' | 'aptitude' | 'personality' | 'values' | 'domain';

export const SECTION_META: Record<
  SectionType,
  { name: string; durationMin: number; isTimed: boolean; questionsCount: number; teaser?: string }
> = {
  interests: {
    name: 'Interests (RIASEC)',
    durationMin: 10,
    isTimed: false,
    questionsCount: 60,
  },
  aptitude: {
    name: 'Aptitude & Reasoning',
    durationMin: 12,
    isTimed: true,
    questionsCount: 20,
    teaser: 'You seem to enjoy solving problems with structured logic.',
  },
  personality: {
    name: 'Workstyle & Personality',
    durationMin: 8,
    isTimed: false,
    questionsCount: 40,
    teaser: 'Your approach leans toward imaginative collaboration.',
  },
  values: {
    name: 'Core Career Values',
    durationMin: 5,
    isTimed: false,
    questionsCount: 20,
    teaser: 'Impact and intellectual independence rank strongly for you.',
  },
  domain: {
    name: 'Analytical & Domain Knowledge',
    durationMin: 10,
    isTimed: true,
    questionsCount: 30,
    teaser: 'You demonstrate strong systematic diagnostic thinking.',
  },
};
