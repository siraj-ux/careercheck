import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    section: text('section', {
      enum: ['interests', 'aptitude', 'personality', 'values', 'domain'],
    }).notNull(),
    subType: text('sub_type'),
    type: text('type', { enum: ['likert', 'mcq'] }).notNull(),
    stemText: text('stem_text').notNull(),
    stemImage: text('stem_image'),
    optionsJson: text('options_json'), // JSON array: { key: string; text: string }[]
    correctKey: text('correct_key'), // Correct answer key (MCQ only). Never sent to client!
    riasecLetter: text('riasec_letter', { enum: ['R', 'I', 'A', 'S', 'E', 'C'] }),
    spectrum: text('spectrum'),
    valueKey: text('value_key'),
    reverseScored: integer('reverse_scored').notNull().default(0), // 0 or 1
    level: text('level', { enum: ['UG', 'PG', 'both'] }).notNull().default('both'),
    status: text('status', { enum: ['live', 'draft'] }).notNull().default('live'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('questions_section_idx').on(table.section),
    index('questions_status_idx').on(table.status),
    index('questions_level_idx').on(table.level),
  ]
);

export const testSessions = sqliteTable(
  'test_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    level: text('level', { enum: ['UG', 'PG'] }).notNull(),
    status: text('status', {
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
    })
      .notNull()
      .default('not_started'),
    currentSection: text('current_section').notNull().default('interests'),
    currentQuestionIndex: integer('current_question_index').notNull().default(0),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('test_sessions_user_idx').on(table.userId),
    index('test_sessions_status_idx').on(table.status),
  ]
);

export const testSectionProgress = sqliteTable(
  'test_section_progress',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => testSessions.id, { onDelete: 'cascade' }),
    section: text('section', {
      enum: ['interests', 'aptitude', 'personality', 'values', 'domain'],
    }).notNull(),
    startedAt: text('started_at').notNull(),
    deadline: text('deadline'), // Server-enforced expiry for timed sections
    submittedAt: text('submitted_at'),
    timeTakenSeconds: integer('time_taken_seconds'),
  },
  (table) => [
    index('section_progress_session_idx').on(table.sessionId),
    index('section_progress_section_idx').on(table.section),
  ]
);

export const responses = sqliteTable(
  'responses',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => testSessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id),
    answer: text('answer').notNull(), // '1'-'5' for Likert or 'A'-'D' for MCQ
    timeTakenSeconds: integer('time_taken_seconds'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('responses_session_idx').on(table.sessionId),
    index('responses_question_idx').on(table.questionId),
  ]
);

export const results = sqliteTable(
  'results',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .unique()
      .references(() => testSessions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    riasecCode: text('riasec_code').notNull(), // Top 3 letters e.g. "IAR"
    radarScoresJson: text('radar_scores_json').notNull(), // JSON: Record<RiasecLetter, number>
    aptitudeScoresJson: text('aptitude_scores_json').notNull(), // JSON: { logical, verbal, spatial, overall }
    personalitySpectrumsJson: text('personality_spectrums_json').notNull(), // JSON: Record<Spectrum, number>
    topValuesJson: text('top_values_json').notNull(), // JSON: string[]
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('results_user_idx').on(table.userId),
    index('results_session_idx').on(table.sessionId),
  ]
);
