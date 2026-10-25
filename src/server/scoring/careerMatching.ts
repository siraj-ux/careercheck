import { RiasecLetter, SpectrumKey, SCORING_WEIGHTS } from '@/config/scoring';
import { CareerArchetype, CAREER_CATALOG } from '@/config/careers';
import { AptitudeScores } from './aptitude';
import { PersonalityScores } from './personality';

export interface MatchedCareerResult {
  careerId: string;
  cluster: string;
  title: string;
  description: string;
  fitPercent: number; // 0 to 100
  reasons: string[]; // 2 to 3 plain-language bullet points
  matchComponents: {
    interestMatch: number;
    aptitudeMatch: number;
    personalityValuesMatch: number;
  };
}

/**
 * Calculates cosine similarity between two 6-dimensional RIASEC vectors
 */
function calculateRiasecCosineSimilarity(
  studentScores: Record<RiasecLetter, number>,
  careerWeights: Record<RiasecLetter, number>
): number {
  const letters: RiasecLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  let dotProduct = 0;
  let studentMagSq = 0;
  let careerMagSq = 0;

  for (const l of letters) {
    const s = studentScores[l] || 0;
    const c = careerWeights[l] || 0;
    dotProduct += s * c;
    studentMagSq += s * s;
    careerMagSq += c * c;
  }

  const studentMag = Math.sqrt(studentMagSq);
  const careerMag = Math.sqrt(careerMagSq);

  if (studentMag === 0 || careerMag === 0) return 0.5;

  const cosine = dotProduct / (studentMag * careerMag);
  return Math.max(0, Math.min(1, cosine));
}

/**
 * Calculates how well student's aptitude meets career requirements
 */
function calculateAptitudeMatch(
  studentAptitude: AptitudeScores,
  careerReq: { logical: number; verbal: number; spatial: number }
): { score: number; strongestSubtype: string } {
  const evaluate = (studentVal: number, reqVal: number) => {
    if (reqVal <= 0) return 100;
    if (studentVal >= reqVal) return 100;
    return Math.max(20, Math.round((studentVal / reqVal) * 100));
  };

  const lScore = evaluate(studentAptitude.logical, careerReq.logical);
  const vScore = evaluate(studentAptitude.verbal, careerReq.verbal);
  const sScore = evaluate(studentAptitude.spatial, careerReq.spatial);

  const avg = Math.round((lScore + vScore + sScore) / 3);

  // Determine strongest subtype
  let strongest = 'logical';
  let maxScore = studentAptitude.logical;
  if (studentAptitude.verbal > maxScore) {
    maxScore = studentAptitude.verbal;
    strongest = 'verbal';
  }
  if (studentAptitude.spatial > maxScore) {
    strongest = 'spatial';
  }

  return { score: avg, strongestSubtype: strongest };
}

/**
 * Generates 2-3 short, template-based plain language reasons for the match
 */
function generateCareerReasons(params: {
  career: CareerArchetype;
  studentRiasecTop: RiasecLetter[];
  studentAptitude: AptitudeScores;
  personalityMatchScore: number;
  topValues: string[];
}): string[] {
  const { career, studentRiasecTop, studentAptitude, topValues } = params;
  const reasons: string[] = [];

  // Reason 1: Interest alignment
  const matchingLetters = studentRiasecTop.filter((l) => (career.riasecWeights[l] || 0) >= 60);
  if (matchingLetters.length >= 2) {
    reasons.push(`High affinity for ${matchingLetters.join(' & ')}-oriented challenges`);
  } else if (studentRiasecTop.includes('A') && (career.riasecWeights.A || 0) >= 70) {
    reasons.push('Natural fit for open creative direction and visual design');
  } else if (studentRiasecTop.includes('I') && (career.riasecWeights.I || 0) >= 70) {
    reasons.push('Strong drive for analytical inquiry and problem diagnosis');
  } else if (studentRiasecTop.includes('E') && (career.riasecWeights.E || 0) >= 70) {
    reasons.push('Persuasive communication and leadership instincts');
  } else {
    reasons.push(`Strong overlap with core ${career.cluster.toLowerCase()} competencies`);
  }

  // Reason 2: Aptitude synergy
  if (studentAptitude.spatial >= 70 && career.aptitudeReq.spatial >= 65) {
    reasons.push('High spatial reasoning well suited for complex structural systems');
  } else if (studentAptitude.logical >= 70 && career.aptitudeReq.logical >= 65) {
    reasons.push('Robust logical reasoning matching complex quantitative demands');
  } else if (studentAptitude.verbal >= 70 && career.aptitudeReq.verbal >= 65) {
    reasons.push('Clear verbal comprehension for articulate synthesis and documentation');
  } else {
    reasons.push('Balanced aptitude profile across required operational skills');
  }

  // Reason 3: Value overlap or personality harmony
  const valueOverlap = topValues.filter((v) => career.valueTags.includes(v));
  if (valueOverlap.length > 0) {
    reasons.push(`Directly satisfies personal value for ${valueOverlap.slice(0, 2).join(' & ')}`);
  } else {
    reasons.push(`Complementary working style aligned with daily ${career.cluster} dynamics`);
  }

  return reasons.slice(0, 3);
}

/**
 * Pure career matching engine
 * Computes ranked career matches using the weighted multi-factor formula:
 * fit = 0.50 * interest_match + 0.30 * aptitude_match + 0.20 * personality_values_match
 * Returns top 6 ranked careers.
 */
export function matchCareers(params: {
  riasecScores: Record<RiasecLetter, number>;
  riasecTopLetters: RiasecLetter[];
  aptitudeScores: AptitudeScores;
  personalityScores: PersonalityScores;
  topValues: string[];
  level?: 'UG' | 'PG';
}): MatchedCareerResult[] {
  const { riasecScores, riasecTopLetters, aptitudeScores, personalityScores, topValues, level = 'UG' } = params;

  // Filter careers for the student's level
  const candidates = CAREER_CATALOG.filter((c) => c.levels.includes(level));

  const matched: MatchedCareerResult[] = candidates.map((career) => {
    // 1. Interest Match (cosine similarity scaled to 0-100)
    const cos = calculateRiasecCosineSimilarity(riasecScores, career.riasecWeights);
    const interestMatch = Math.round(cos * 100);

    // 2. Aptitude Match
    const { score: aptitudeMatch } = calculateAptitudeMatch(aptitudeScores, career.aptitudeReq);

    // 3. Personality & Values Match
    let spectrumClosenessSum = 0;
    let spectrumCount = 0;
    if (career.personalityProfile) {
      for (const [key, profile] of Object.entries(career.personalityProfile)) {
        if (profile && profile.ideal !== undefined) {
          const studentVal = personalityScores[key as SpectrumKey] ?? 50;
          const diff = Math.abs(studentVal - profile.ideal);
          spectrumClosenessSum += Math.max(0, 100 - diff);
          spectrumCount += 1;
        }
      }
    }
    const avgSpectrumCloseness = spectrumCount > 0 ? spectrumClosenessSum / spectrumCount : 75;

    const valueMatches = topValues.filter((v) => career.valueTags.includes(v)).length;
    const valueScore = Math.min(100, valueMatches * 40 + 20);

    const personalityValuesMatch = Math.round(0.6 * avgSpectrumCloseness + 0.4 * valueScore);

    // Composite Fit Formula: 0.50 * interest + 0.30 * aptitude + 0.20 * personality/values
    const composite =
      SCORING_WEIGHTS.interest * interestMatch +
      SCORING_WEIGHTS.aptitude * aptitudeMatch +
      SCORING_WEIGHTS.personalityValues * personalityValuesMatch;

    const fitPercent = Math.min(98, Math.max(45, Math.round(composite)));

    const reasons = generateCareerReasons({
      career,
      studentRiasecTop: riasecTopLetters,
      studentAptitude: aptitudeScores,
      personalityMatchScore: personalityValuesMatch,
      topValues,
    });

    return {
      careerId: career.id,
      cluster: career.cluster,
      title: career.title,
      description: career.description,
      fitPercent,
      reasons,
      matchComponents: {
        interestMatch,
        aptitudeMatch,
        personalityValuesMatch,
      },
    };
  });

  // Sort descending by fitPercent
  matched.sort((a, b) => b.fitPercent - a.fitPercent);

  // Return top 6 careers
  return matched.slice(0, 6);
}
