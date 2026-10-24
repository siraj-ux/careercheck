import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { results } from './tests';

export const otpCodes = sqliteTable(
  'otp_codes',
  {
    id: text('id').primaryKey(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: text('consumed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('otp_codes_phone_idx').on(table.phone),
    index('otp_codes_expires_idx').on(table.expiresAt),
  ]
);

export const parentShareLinks = sqliteTable(
  'parent_share_links',
  {
    id: text('id').primaryKey(),
    resultId: text('result_id')
      .notNull()
      .references(() => results.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: text('expires_at').notNull(),
    revokedAt: text('revoked_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('parent_share_token_idx').on(table.tokenHash),
    index('parent_share_user_idx').on(table.userId),
  ]
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    payloadJson: text('payload_json'),
    readAt: text('read_at'),
    emailedAt: text('emailed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('notifications_user_idx').on(table.userId),
    index('notifications_read_idx').on(table.readAt),
  ]
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(), // 'view_student_360', 'publish_roadmap', etc.
    targetUserId: text('target_user_id').references(() => users.id),
    detailsJson: text('details_json'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('audit_logs_actor_idx').on(table.actorId),
    index('audit_logs_target_idx').on(table.targetUserId),
    index('audit_logs_created_idx').on(table.createdAt),
  ]
);

export const appConfigs = sqliteTable('app_configs', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: text('updated_at').notNull(),
});
