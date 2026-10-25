import { COLLEGE_MATCHING_RULES } from '@/config/scoring';

export interface CollegeEntity {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  annualFees: number;
  cutoffPercent: number;
  examsJson: string; // JSON: string[]
  coursesJson: string; // JSON: string[]
  level: string; // 'UG' | 'PG' | 'both'
}

export interface MatchedCollege {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  annualFees: number;
  cutoffPercent: number;
  exams: string[];
  courses: string[];
  category: 'safe' | 'target' | 'reach';
  isPreferredCity: boolean;
}

export interface CollegeMatchingResult {
  safe: MatchedCollege[];
  target: MatchedCollege[];
  reach: MatchedCollege[];
  totalMatched: number;
  disclaimer: string;
}

export interface StudentCollegePreferences {
  marksPercent?: number | null;
  budgetAmount?: number | null; // Annual in INR
  loanOpenness?: boolean | number | null;
  preferredCities?: string[] | null;
  relocate?: boolean | number | null;
  level?: 'UG' | 'PG';
}

/**
 * Pure College Matching Engine
 * Groups eligible colleges into Safe / Target / Reach based on marks, budget, and location.
 */
export function matchColleges(
  colleges: CollegeEntity[],
  prefs: StudentCollegePreferences
): CollegeMatchingResult {
  const marks = prefs.marksPercent ?? 80;
  const level = prefs.level ?? 'UG';
  const openToLoan = Boolean(prefs.loanOpenness);
  const openToRelocate = Boolean(prefs.relocate);
  const preferredCities = (prefs.preferredCities || []).map((c) => c.trim().toLowerCase());

  // Budget threshold (default to ₹5,00,000 if not specified)
  const baseBudget = prefs.budgetAmount && prefs.budgetAmount > 0 ? prefs.budgetAmount : 500000;
  const maxAllowedFees = openToLoan
    ? baseBudget * COLLEGE_MATCHING_RULES.loanBudgetMultiplier
    : baseBudget;

  const safeList: MatchedCollege[] = [];
  const targetList: MatchedCollege[] = [];
  const reachList: MatchedCollege[] = [];

  for (const col of colleges) {
    // 1. Level check
    if (col.level !== 'both' && col.level !== level) {
      continue;
    }

    // 2. Budget filter
    if (col.annualFees > maxAllowedFees) {
      continue;
    }

    // 3. Location preference check
    const collegeCityLower = col.city.toLowerCase();
    const isPreferredCity = preferredCities.includes(collegeCityLower);

    // If student has preferred cities and not open to relocating, only include preferred cities
    if (preferredCities.length > 0 && !openToRelocate && !isPreferredCity) {
      continue;
    }

    // Parse JSON fields safely
    let exams: string[] = [];
    let courses: string[] = [];
    try {
      exams = JSON.parse(col.examsJson);
    } catch {
      exams = [];
    }
    try {
      courses = JSON.parse(col.coursesJson);
    } catch {
      courses = [];
    }

    const cutoff = col.cutoffPercent;
    let category: 'safe' | 'target' | 'reach' | null = null;

    // Rules from product.md:
    // Safe: marks >= cutoff + 5
    // Target: marks within cutoff ± 5
    // Reach: marks below cutoff by > 5 and up to 15 (cutoff - 15 <= marks < cutoff - 5)
    if (marks >= cutoff + COLLEGE_MATCHING_RULES.safeMargin) {
      category = 'safe';
    } else if (Math.abs(marks - cutoff) <= COLLEGE_MATCHING_RULES.targetMargin) {
      category = 'target';
    } else if (marks < cutoff - COLLEGE_MATCHING_RULES.safeMargin && marks >= cutoff - COLLEGE_MATCHING_RULES.reachMarginMax) {
      category = 'reach';
    }

    if (!category) {
      continue; // Below reach range or outside admission window
    }

    const matchedCol: MatchedCollege = {
      id: col.id,
      name: col.name,
      city: col.city,
      state: col.state,
      type: col.type,
      annualFees: col.annualFees,
      cutoffPercent: col.cutoffPercent,
      exams,
      courses,
      category,
      isPreferredCity,
    };

    if (category === 'safe') safeList.push(matchedCol);
    if (category === 'target') targetList.push(matchedCol);
    if (category === 'reach') reachList.push(matchedCol);
  }

  // Sort each list: preferred cities first, then by cutoff closeness
  const sortFn = (a: MatchedCollege, b: MatchedCollege) => {
    if (a.isPreferredCity !== b.isPreferredCity) {
      return a.isPreferredCity ? -1 : 1;
    }
    return Math.abs(marks - a.cutoffPercent) - Math.abs(marks - b.cutoffPercent);
  };

  safeList.sort(sortFn);
  targetList.sort(sortFn);
  reachList.sort(sortFn);

  // Cap at 5 per category
  const cappedSafe = safeList.slice(0, COLLEGE_MATCHING_RULES.maxCollegesPerCategory);
  const cappedTarget = targetList.slice(0, COLLEGE_MATCHING_RULES.maxCollegesPerCategory);
  const cappedReach = reachList.slice(0, COLLEGE_MATCHING_RULES.maxCollegesPerCategory);

  return {
    safe: cappedSafe,
    target: cappedTarget,
    reach: cappedReach,
    totalMatched: cappedSafe.length + cappedTarget.length + cappedReach.length,
    disclaimer: COLLEGE_MATCHING_RULES.disclaimer,
  };
}
