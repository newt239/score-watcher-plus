import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

import { user } from "./auth";

export const planCodeValues = ["free", "plus"] as const;

export const subscriptionStatusValues = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
] as const;

// ユーザーごとの契約状態
export const userSubscription = sqliteTable("user_subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  planCode: text("plan_code", { enum: planCodeValues }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status", { enum: subscriptionStatusValues }),
  // 現在の課金期間の終了日時
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  // 期間終了時に解約する予定かどうか
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const userSubscriptionUserIdIdx = index("idx_user_subscription_user_id").on(
  userSubscription.userId
);

export const userSubscriptionCustomerIdIdx = index("idx_user_subscription_customer_id").on(
  userSubscription.stripeCustomerId
);
