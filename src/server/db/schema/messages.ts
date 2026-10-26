import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { consultants } from './consultants';

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consultantId: text('consultant_id')
      .notNull()
      .references(() => consultants.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    readAt: text('read_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('messages_student_idx').on(table.studentId),
    index('messages_consultant_idx').on(table.consultantId),
    index('messages_sender_idx').on(table.senderId),
  ]
);
