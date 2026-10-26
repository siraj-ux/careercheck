import { pgTable, text, integer, real, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const colleges = pgTable(
  'colleges',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    type: text('type').notNull(), // 'Govt', 'Private', etc.
    annualFees: integer('annual_fees').notNull(), // INR
    cutoffPercent: real('cutoff_percent').notNull(),
    examsJson: text('exams_json').notNull(), // JSON: string[]
    coursesJson: text('courses_json').notNull(), // JSON: string[]
    level: text('level', { enum: ['UG', 'PG', 'both'] }).notNull().default('both'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('colleges_city_idx').on(table.city),
    index('colleges_level_idx').on(table.level),
    index('colleges_cutoff_idx').on(table.cutoffPercent),
  ]
);

export const savedColleges = pgTable(
  'saved_colleges',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    collegeId: text('college_id')
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('saved_colleges_student_idx').on(table.studentId),
    index('saved_colleges_college_idx').on(table.collegeId),
  ]
);
