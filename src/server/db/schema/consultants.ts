import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const consultants = sqliteTable(
  'consultants',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    credentialsJson: text('credentials_json').notNull(), // JSON: string[]
    bio: text('bio').notNull(),
    languagesJson: text('languages_json').notNull(), // JSON: string[]
    specialisationsJson: text('specialisations_json').notNull(), // JSON: string[]
    rating: real('rating').notNull().default(5.0),
    studentCount: integer('student_count').notNull().default(0),
    isActive: integer('is_active').notNull().default(1), // 0 or 1
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('consultants_user_idx').on(table.userId),
    index('consultants_active_idx').on(table.isActive),
  ]
);

export const consultantAvailabilities = sqliteTable(
  'consultant_availabilities',
  {
    id: text('id').primaryKey(),
    consultantId: text('consultant_id')
      .notNull()
      .references(() => consultants.id, { onDelete: 'cascade' }),
    weekday: integer('weekday').notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startTime: text('start_time').notNull(), // HH:MM e.g. "10:00"
    endTime: text('end_time').notNull(), // HH:MM e.g. "18:00"
    isActive: integer('is_active').notNull().default(1), // 0 or 1
  },
  (table) => [
    index('availabilities_consultant_idx').on(table.consultantId),
  ]
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consultantId: text('consultant_id')
      .notNull()
      .references(() => consultants.id, { onDelete: 'cascade' }),
    scheduledAt: text('scheduled_at').notNull(), // ISO-8601 UTC
    durationMinutes: integer('duration_minutes').notNull().default(45),
    status: text('status', {
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    })
      .notNull()
      .default('scheduled'),
    joinLink: text('join_link'),
    rescheduleCount: integer('reschedule_count').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('sessions_student_idx').on(table.studentId),
    index('sessions_consultant_idx').on(table.consultantId),
    index('sessions_status_idx').on(table.status),
    index('sessions_scheduled_idx').on(table.scheduledAt),
  ]
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consultantId: text('consultant_id')
      .notNull()
      .references(() => consultants.id, { onDelete: 'cascade' }),
    visibility: text('visibility', { enum: ['private', 'shared'] })
      .notNull()
      .default('private'),
    body: text('body').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('notes_student_idx').on(table.studentId),
    index('notes_consultant_idx').on(table.consultantId),
    index('notes_visibility_idx').on(table.visibility),
  ]
);
