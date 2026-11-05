import { createFactory } from "hono/factory";

import { getUserId } from "@/server/repositories/auth";
import { getSubscriptionStatus } from "@/server/repositories/subscription";

const factory = createFactory();

/** 現在の契約状態と上限値・利用状況を取得する */
const handler = factory.createHandlers(async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    return c.json(await getSubscriptionStatus(userId));
  } catch (error) {
    console.error("Failed to get subscription status:", error);
    return c.json({ error: "契約状態の取得に失敗しました" } as const, 500);
  }
});

export default handler;
