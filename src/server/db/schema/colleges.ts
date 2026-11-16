import { pgTable, text, integer, real, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const colleges = pgTable(
  'colleges',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    type: text('type'), // 'Govt', 'Private', etc. (can be null until updated by admin)
    annualFees: integer('annual_fees'), // INR (can be null until updated by admin)
    cutoffPercent: real('cutoff_percent'), // (can be null until updated by admin)
    examsJson: text('exams_json'), // JSON: string[] (can be null until updated by admin)
    coursesJson: text('courses_json'), // JSON: string[] (can be null until updated by admin)
    level: text('level', { enum: ['UG', 'PG', 'both'] }).default('both'),
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
