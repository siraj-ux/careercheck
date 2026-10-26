import { pgTable, text, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // stored in paise, e.g. 149900 for ₹1,499
    currency: text('currency').notNull().default('INR'),
    status: text('status', {
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    })
      .notNull()
      .default('created'),
    planUnlocked: text('plan_unlocked').notNull().default('career_plan'),
    razorpayOrderId: text('razorpay_order_id'),
    razorpayPaymentId: text('razorpay_payment_id'),
    razorpaySignature: text('razorpay_signature'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('payments_user_idx').on(table.userId),
    index('payments_status_idx').on(table.status),
    index('payments_order_idx').on(table.razorpayOrderId),
  ]
);
