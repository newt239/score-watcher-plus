import { createFactory } from "hono/factory";

import { getUserId } from "@/server/repositories/auth";
import { countUserResources, getUserSubscription } from "@/server/repositories/subscription";
import { PLAN_LIMITS } from "@/server/utils/subscription/config";

const factory = createFactory();

/** 現在の契約状態と上限値・利用状況を取得する */
const handler = factory.createHandlers(async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const subscription = await getUserSubscription(userId);
    const usage = await countUserResources(userId);
    const limits = PLAN_LIMITS[subscription.planCode];

    return c.json({
      planCode: subscription.planCode,
      planName: limits.name,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: {
        game: limits.game,
        player: limits.player,
        quiz: limits.quiz,
        viewerRateLimitPerMinute: limits.viewerRateLimitPerMinute,
      },
      usage,
    } as const);
  } catch (error) {
    console.error("Failed to get subscription status:", error);
    return c.json({ error: "契約状態の取得に失敗しました" } as const, 500);
  }
});

export default handler;
