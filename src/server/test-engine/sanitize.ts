import { questions } from '@/server/db/schema/tests';

export interface ClientQuestion {
  id: string;
  section: 'interests' | 'aptitude' | 'personality' | 'values' | 'domain';
  subType: string | null;
  type: 'likert' | 'mcq';
  stemText: string;
  stemImage: string | null;
  options: { key: string; text: string }[] | null;
  level: 'UG' | 'PG' | 'both';
}

/**
 * Sanitizes questions for client delivery.
 * CRITICAL SECURITY RULE: NEVER leak `correctKey` or internal scoring metadata to the client.
 */
export function sanitizeQuestionForClient(q: typeof questions.$inferSelect): ClientQuestion {
  let options: { key: string; text: string }[] | null = null;
  if (q.optionsJson) {
    try {
      options = JSON.parse(q.optionsJson);
    } catch {
      options = null;
    }
  }

  return {
    id: q.id,
    section: q.section as ClientQuestion['section'],
    subType: q.subType,
    type: q.type as ClientQuestion['type'],
    stemText: q.stemText,
    stemImage: q.stemImage,
    options,
    level: q.level as ClientQuestion['level'],
  };
}
