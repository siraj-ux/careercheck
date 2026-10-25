import { describe, it, expect } from 'vitest';
import { calculateRiasecScores, RiasecInputItem } from '../src/server/scoring/riasec';
import { calculateAptitudeScores, AptitudeInputItem } from '../src/server/scoring/aptitude';
import { calculatePersonalityScores, PersonalityInputItem } from '../src/server/scoring/personality';
import { calculateValuesScores, ValuesInputItem } from '../src/server/scoring/values';
import { matchCareers } from '../src/server/scoring/careerMatching';
import { matchColleges, CollegeEntity } from '../src/server/scoring/collegeMatching';

describe('Scoring Engine Unit Tests', () => {
  describe('1. RIASEC Scoring & Deterministic Tie-Breaking', () => {
    it('accurately normalizes 1-5 Likert scale across RIASEC letters', () => {
      // 10 items for 'I' with highest score (5 each = 50 raw -> 100 normalized)
      // 10 items for 'A' with 4 each = 40 raw -> 75 normalized
      // 10 items for 'R' with 3 each = 30 raw -> 50 normalized
      // Other letters 1 each = 10 raw -> 0 normalized
      const items: RiasecInputItem[] = [
        ...Array(10).fill({ riasecLetter: 'I', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'A', answer: 4 }),
        ...Array(10).fill({ riasecLetter: 'R', answer: 3 }),
        ...Array(10).fill({ riasecLetter: 'S', answer: 1 }),
        ...Array(10).fill({ riasecLetter: 'E', answer: 1 }),
        ...Array(10).fill({ riasecLetter: 'C', answer: 1 }),
      ];

      const result = calculateRiasecScores(items);
      expect(result.scores.I).toBe(100);
      expect(result.scores.A).toBe(75);
      expect(result.scores.R).toBe(50);
      expect(result.scores.S).toBe(0);
      expect(result.code).toBe('IAR');
      expect(result.topLetters).toEqual(['I', 'A', 'R']);
      expect(result.headlineInsight).toContain('investigative');
    });

    it('breaks score ties strictly in the order R, I, A, S, E, C per spec', () => {
      // Give equal maximum score to all 6 letters (5 each)
      const items: RiasecInputItem[] = [
        ...Array(10).fill({ riasecLetter: 'C', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'E', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'S', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'A', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'I', answer: 5 }),
        ...Array(10).fill({ riasecLetter: 'R', answer: 5 }),
      ];

      const result = calculateRiasecScores(items);
      expect(result.scores.R).toBe(100);
      expect(result.scores.I).toBe(100);
      expect(result.scores.A).toBe(100);
      // Top 3 should be R, I, A
      expect(result.code).toBe('RIA');
      expect(result.topLetters).toEqual(['R', 'I', 'A']);
    });
  });

  describe('2. Aptitude Sub-Scores and Arithmetic Mean', () => {
    it('correctly computes logical, verbal, spatial percentages and overall average', () => {
      const items: AptitudeInputItem[] = [
        // Logical: 5 correct out of 7 (~71%)
        { subType: 'logical', userAnswer: 'A', correctKey: 'A' },
        { subType: 'logical', userAnswer: 'B', correctKey: 'B' },
        { subType: 'logical', userAnswer: 'C', correctKey: 'C' },
        { subType: 'logical', userAnswer: 'D', correctKey: 'D' },
        { subType: 'logical', userAnswer: 'A', correctKey: 'A' },
        { subType: 'logical', userAnswer: 'B', correctKey: 'A' }, // wrong
        { subType: 'logical', userAnswer: null, correctKey: 'C' }, // skipped/wrong

        // Verbal: 7 correct out of 7 (100%)
        { subType: 'verbal', userAnswer: 'A', correctKey: 'A' },
        { subType: 'verbal', userAnswer: 'B', correctKey: 'B' },
        { subType: 'verbal', userAnswer: 'C', correctKey: 'C' },
        { subType: 'verbal', userAnswer: 'D', correctKey: 'D' },
        { subType: 'verbal', userAnswer: 'A', correctKey: 'A' },
        { subType: 'verbal', userAnswer: 'B', correctKey: 'B' },
        { subType: 'verbal', userAnswer: 'C', correctKey: 'C' },

        // Spatial: 3 correct out of 6 (50%)
        { subType: 'spatial', userAnswer: 'A', correctKey: 'A' },
        { subType: 'spatial', userAnswer: 'B', correctKey: 'B' },
        { subType: 'spatial', userAnswer: 'C', correctKey: 'C' },
        { subType: 'spatial', userAnswer: 'A', correctKey: 'D' }, // wrong
        { subType: 'spatial', userAnswer: 'B', correctKey: 'D' }, // wrong
        { subType: 'spatial', userAnswer: 'C', correctKey: 'D' }, // wrong
      ];

      const scores = calculateAptitudeScores(items);
      expect(scores.logical).toBe(71);
      expect(scores.verbal).toBe(100);
      expect(scores.spatial).toBe(50);
      expect(scores.overall).toBe(Math.round((71 + 100 + 50) / 3)); // 74
    });
  });

  describe('3. Neutral Personality Spectrums & Reverse-Scoring', () => {
    it('properly inverts reverse-scored items (6 - answer) and normalizes 0-100', () => {
      const items: PersonalityInputItem[] = [
        // reserved_outgoing: 2 regular items answer 5, 2 reversed items answer 1 (6-1=5).
        // Total = 5+5+5+5 = 20 raw out of 20 max -> 100% Outgoing
        { spectrum: 'reserved_outgoing', answer: 5, reverseScored: 0 },
        { spectrum: 'reserved_outgoing', answer: 5, reverseScored: 0 },
        { spectrum: 'reserved_outgoing', answer: 1, reverseScored: 1 },
        { spectrum: 'reserved_outgoing', answer: 1, reverseScored: 1 },

        // spontaneous_organised: answer 1 with reverseScored: 0 -> 0% (Spontaneous)
        { spectrum: 'spontaneous_organised', answer: 1, reverseScored: 0 },
        { spectrum: 'spontaneous_organised', answer: 1, reverseScored: 0 },
      ];

      const scores = calculatePersonalityScores(items);
      expect(scores.reserved_outgoing).toBe(100);
      expect(scores.spontaneous_organised).toBe(0);
    });
  });

  describe('4. Values Ranking', () => {
    it('extracts top 3 values based on aggregated Likert priority', () => {
      const items: ValuesInputItem[] = [
        { valueKey: 'Creativity', answer: 5 },
        { valueKey: 'Creativity', answer: 5 },
        { valueKey: 'Impact', answer: 5 },
        { valueKey: 'Impact', answer: 4 },
        { valueKey: 'Independence', answer: 4 },
        { valueKey: 'Stability', answer: 2 },
        { valueKey: 'Income', answer: 3 },
      ];

      const values = calculateValuesScores(items);
      expect(values.topValues.length).toBe(3);
      expect(values.topValues[0]).toBe('Creativity');
      expect(values.topValues[1]).toBe('Impact');
      expect(values.topValues[2]).toBe('Independence');
    });
  });

  describe('5. Career Matching Engine', () => {
    it('accurately scores career candidates with weighted formula and generates reasons', () => {
      const results = matchCareers({
        riasecScores: { R: 30, I: 95, A: 90, S: 70, E: 45, C: 40 },
        riasecTopLetters: ['I', 'A', 'S'],
        aptitudeScores: {
          logical: 85,
          verbal: 80,
          spatial: 90,
          overall: 85,
          breakdown: {
            logical: { correct: 6, total: 7 },
            verbal: { correct: 6, total: 7 },
            spatial: { correct: 5, total: 6 },
          },
        },
        personalityScores: {
          reserved_outgoing: 50,
          spontaneous_organised: 65,
          practical_imaginative: 85,
          competitive_collaborative: 75,
          calm_sensitive: 60,
        },
        topValues: ['Creativity', 'Impact', 'Continuous Learning'],
        level: 'UG',
      });

      // Top 6 returned
      expect(results.length).toBe(6);
      expect(results[0].fitPercent).toBeGreaterThanOrEqual(80);
      expect(results[0].reasons.length).toBeGreaterThanOrEqual(2);

      // UI/UX Designer should be very high rank given High A, I, Spatial & Creativity
      const titles = results.map((r) => r.title);
      expect(titles.some((t) => t.includes('Designer') || t.includes('Data'))).toBe(true);
    });
  });

  describe('6. College Matching Engine', () => {
    const sampleColleges: CollegeEntity[] = [
      {
        id: 'col-1',
        name: 'Safe Technical Institute',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Private',
        annualFees: 200000,
        cutoffPercent: 75, // Student has 85% -> 85 >= 75+5 (Safe)
        examsJson: JSON.stringify(['KCET']),
        coursesJson: JSON.stringify(['Computer Science']),
        level: 'both',
      },
      {
        id: 'col-2',
        name: 'Target University of Tech',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Govt',
        annualFees: 120000,
        cutoffPercent: 84, // Student has 85% -> within ±5 (Target)
        examsJson: JSON.stringify(['CUET']),
        coursesJson: JSON.stringify(['Data Science']),
        level: 'both',
      },
      {
        id: 'col-3',
        name: 'Reach National Academy',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Govt',
        annualFees: 180000,
        cutoffPercent: 93, // Student has 85% -> 93-85=8 (within 5-15 Reach)
        examsJson: JSON.stringify(['JEE Main']),
        coursesJson: JSON.stringify(['Artificial Intelligence']),
        level: 'both',
      },
      {
        id: 'col-4',
        name: 'Out of Reach Institute',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Govt',
        annualFees: 100000,
        cutoffPercent: 105, // Student has 85% -> > 15 diff -> excluded
        examsJson: JSON.stringify(['JEE']),
        coursesJson: JSON.stringify(['CS']),
        level: 'both',
      },
      {
        id: 'col-5',
        name: 'Expensive Private College',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Private',
        annualFees: 800000, // Exceeds standard budget of 300000
        cutoffPercent: 80,
        examsJson: JSON.stringify(['MHT-CET']),
        coursesJson: JSON.stringify(['Design']),
        level: 'both',
      },
    ];

    it('classifies colleges into Safe, Target, Reach and enforces budget limits', () => {
      const match = matchColleges(sampleColleges, {
        marksPercent: 85,
        budgetAmount: 300000,
        loanOpenness: false,
        preferredCities: ['Bengaluru'],
        relocate: false,
        level: 'UG',
      });

      expect(match.safe.length).toBe(1);
      expect(match.safe[0].name).toBe('Safe Technical Institute');

      expect(match.target.length).toBe(1);
      expect(match.target[0].name).toBe('Target University of Tech');

      expect(match.reach.length).toBe(1);
      expect(match.reach[0].name).toBe('Reach National Academy');

      // Expensive college excluded because 800000 > 300000
      expect(match.safe.some((c) => c.name.includes('Expensive'))).toBe(false);
      expect(match.target.some((c) => c.name.includes('Expensive'))).toBe(false);

      expect(match.disclaimer).toBeDefined();
    });

    it('expands allowed budget by 30% when openToLoan is enabled', () => {
      const budgetCollege: CollegeEntity = {
        id: 'col-loan',
        name: 'Premium College',
        city: 'Mumbai',
        state: 'Maharashtra',
        type: 'Private',
        annualFees: 350000, // > 300000 base, but <= 390000 (300k * 1.3)
        cutoffPercent: 85,
        examsJson: '[]',
        coursesJson: '[]',
        level: 'both',
      };

      // Without loan
      const withoutLoan = matchColleges([budgetCollege], {
        marksPercent: 85,
        budgetAmount: 300000,
        loanOpenness: false,
        relocate: true,
      });
      expect(withoutLoan.target.length).toBe(0);

      // With loan
      const withLoan = matchColleges([budgetCollege], {
        marksPercent: 85,
        budgetAmount: 300000,
        loanOpenness: true,
        relocate: true,
      });
      expect(withLoan.target.length).toBe(1);
      expect(withLoan.target[0].name).toBe('Premium College');
    });
  });
});
