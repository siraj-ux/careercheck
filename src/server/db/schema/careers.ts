import { pgTable, text, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { results } from './tests';

export const careerMatches = pgTable(
  'career_matches',
  {
    id: text('id').primaryKey(),
    resultId: text('result_id')
      .notNull()
      .references(() => results.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cluster: text('cluster').notNull(),
    title: text('title').notNull(),
    fitPercent: integer('fit_percent').notNull(), // 0 to 100
    reasonsJson: text('reasons_json').notNull(), // JSON: string[]
    consultantStatus: text('consultant_status', {
      enum: ['pending', 'accepted', 'edited', 'overridden'],
    })
      .notNull()
      .default('pending'),
    consultantNotes: text('consultant_notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('career_matches_user_idx').on(table.userId),
    index('career_matches_result_idx').on(table.resultId),
    index('career_matches_status_idx').on(table.consultantStatus),
  ]
);
