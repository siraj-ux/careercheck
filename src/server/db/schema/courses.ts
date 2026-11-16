import { pgTable, text, index } from 'drizzle-orm/pg-core';

export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(), // 'MEDICAL', 'OTHER BSC COURSES', 'ENGINEERING', 'BCA', 'BBA', 'BCOM', 'OTHER DEGREE COURSES'
    level: text('level', { enum: ['UG', 'PG', 'both'] }).default('UG'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('courses_category_idx').on(table.category),
    index('courses_level_idx').on(table.level),
    index('courses_name_idx').on(table.name),
  ]
);
