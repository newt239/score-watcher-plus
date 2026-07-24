import { and, count, eq, isNull } from "drizzle-orm";

import { DBClient } from "@/utils/drizzle/client";
import { game, player, quizQuestion, userSubscription } from "@/utils/drizzle/schema";

import { DEFAULT_PLAN_CODE, PLAN_LIMITS } from "../utils/subscription/config";

import type { PlanCode } from "../utils/subscription/config";

import type { subscriptionStatusValues } from "@/utils/drizzle/schema";

type SubscriptionStatus = (typeof subscriptionStatusValues)[number];

/** 契約が有効とみなすステータス */
const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

/**
 * ユーザーの契約状態を取得する
 *
 * 契約情報が無い場合や支払いが有効でない場合はフリープランとして扱います。
 *
 * @param userId ユーザーID
 * @returns 契約状態
 */
export const getUserSubscription = async (userId: string) => {
  const [subscription] = await DBClient.select()
    .from(userSubscription)
    .where(eq(userSubscription.userId, userId))
    .limit(1);

  if (!subscription) {
    return {
      planCode: DEFAULT_PLAN_CODE,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
    } as const;
  }

  // 支払いが有効でない場合はフリープラン相当として扱う
  const isActive = subscription.status !== null && ACTIVE_STATUSES.includes(subscription.status);
  const planCode: PlanCode = isActive ? subscription.planCode : DEFAULT_PLAN_CODE;

  return {
    planCode,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    stripeCustomerId: subscription.stripeCustomerId,
  } as const;
};

/**
 * ユーザーの契約状態を作成または更新する
 *
 * @param userId ユーザーID
 * @param values 更新する値
 */
export const upsertUserSubscription = async (
  userId: string,
  values: {
    planCode: PlanCode;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    status?: SubscriptionStatus | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }
) => {
  const [existing] = await DBClient.select({ id: userSubscription.id })
    .from(userSubscription)
    .where(eq(userSubscription.userId, userId))
    .limit(1);

  if (existing) {
    await DBClient.update(userSubscription)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(userSubscription.id, existing.id));
    return existing.id;
  }

  const [inserted] = await DBClient.insert(userSubscription)
    .values({ userId, ...values })
    .returning({ id: userSubscription.id });

  return inserted.id;
};

/**
 * StripeのcustomerIdからユーザーIDを引く
 *
 * @param stripeCustomerId StripeのCustomer ID
 * @returns ユーザーID（見つからない場合はnull）
 */
export const findUserIdByStripeCustomerId = async (stripeCustomerId: string) => {
  const [subscription] = await DBClient.select({ userId: userSubscription.userId })
    .from(userSubscription)
    .where(eq(userSubscription.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return subscription?.userId ?? null;
};

/**
 * ユーザーが作成済みのゲーム・プレイヤー・問題の件数を数える
 *
 * @param userId ユーザーID
 * @returns 各リソースの件数
 */
export const countUserResources = async (userId: string) => {
  const [gameCount] = await DBClient.select({ value: count() })
    .from(game)
    .where(and(eq(game.userId, userId), isNull(game.deletedAt)));

  const [playerCount] = await DBClient.select({ value: count() })
    .from(player)
    .where(and(eq(player.userId, userId), isNull(player.deletedAt)));

  const [quizCount] = await DBClient.select({ value: count() })
    .from(quizQuestion)
    .where(and(eq(quizQuestion.userId, userId), isNull(quizQuestion.deletedAt)));

  return {
    game: gameCount.value,
    player: playerCount.value,
    quiz: quizCount.value,
  } as const;
};

/**
 * 作成できる件数の上限に達していないかを判定する
 *
 * @param userId ユーザーID
 * @param resource 対象のリソース
 * @param addingCount これから作成する件数
 * @returns 作成可能かどうかと、上限・現在の件数
 */
export const checkCreationLimit = async (
  userId: string,
  resource: "game" | "player" | "quiz",
  addingCount: number
) => {
  const { planCode } = await getUserSubscription(userId);
  const limits = PLAN_LIMITS[planCode];
  const usage = await countUserResources(userId);

  const limit = limits[resource];
  const current = usage[resource];

  return {
    allowed: current + addingCount <= limit,
    limit,
    current,
    planCode,
  } as const;
};
