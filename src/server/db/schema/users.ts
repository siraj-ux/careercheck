import { pgTable, text, integer, real, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    phone: text('phone').notNull().unique(),
    role: text('role', { enum: ['visitor', 'student', 'consultant', 'admin'] }).notNull(),
    name: text('name'),
    level: text('level', { enum: ['UG', 'PG'] }),
    plan: text('plan', { enum: ['free', 'paid'] }).notNull().default('free'),
    dob: text('dob'), // ISO-8601 date string (YYYY-MM-DD)
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('users_phone_idx').on(table.phone),
    index('users_role_idx').on(table.role),
  ]
);

export const studentProfiles = pgTable(
  'student_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    board: text('board', { enum: ['CBSE', 'ICSE', 'State', 'Other'] }),
    stream: text('stream', {
      enum: ['Science PCM', 'Science PCB', 'Commerce', 'Arts/Humanities', 'Other'],
    }),
    marksPercent: real('marks_percent'),
    pgDegree: text('pg_degree'),
    pgSpecialisation: text('pg_specialisation'),
    pgGradYear: integer('pg_grad_year'),
    pgCgpaOrPercent: text('pg_cgpa_or_percent'),
    interestsJson: text('interests_json'), // JSON array: string[]
    preferredCitiesJson: text('preferred_cities_json'), // JSON array: string[]
    relocate: integer('relocate').notNull().default(0), // 0 or 1
    budgetBand: text('budget_band'),
    budgetAmount: integer('budget_amount'), // in INR
    loanOpenness: integer('loan_openness').notNull().default(0), // 0 or 1
    knowledgeLevel: integer('knowledge_level'), // 1 to 5
    assignedConsultantId: text('assigned_consultant_id'), // References consultants.id
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('student_profiles_user_idx').on(table.userId),
    index('student_profiles_consultant_idx').on(table.assignedConsultantId),
  ]
);

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: text('expires_at').notNull(),
    deviceInfo: text('device_info'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('auth_sessions_user_idx').on(table.userId),
    index('auth_sessions_token_idx').on(table.tokenHash),
    index('auth_sessions_expires_idx').on(table.expiresAt),
  ]
);

export const consentRecords = pgTable(
  'consent_records',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentPhone: text('parent_phone').notNull(),
    policyVersion: text('policy_version').notNull(),
    acceptedAt: text('accepted_at').notNull(),
  },
  (table) => [
    index('consent_records_user_idx').on(table.userId),
  ]
);
