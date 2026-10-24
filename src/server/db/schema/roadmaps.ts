import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { consultants } from './consultants';

export const roadmaps = sqliteTable(
  'roadmaps',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consultantId: text('consultant_id')
      .notNull()
      .references(() => consultants.id, { onDelete: 'cascade' }),
    planType: text('plan_type', { enum: ['primary', 'backup'] })
      .notNull()
      .default('primary'),
    isPublished: integer('is_published').notNull().default(0), // 0 or 1
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('roadmaps_student_idx').on(table.studentId),
    index('roadmaps_consultant_idx').on(table.consultantId),
  ]
);

export const roadmapMilestones = sqliteTable(
  'roadmap_milestones',
  {
    id: text('id').primaryKey(),
    roadmapId: text('roadmap_id')
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull(),
    type: text('type', {
      enum: ['exam', 'apply', 'prep', 'documents', 'decide'],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    deadline: text('deadline').notNull(), // ISO-8601 date string e.g. "2026-03-22"
    status: text('status', { enum: ['pending', 'in_progress', 'completed'] })
      .notNull()
      .default('pending'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('milestones_roadmap_idx').on(table.roadmapId),
    index('milestones_deadline_idx').on(table.deadline),
  ]
);
