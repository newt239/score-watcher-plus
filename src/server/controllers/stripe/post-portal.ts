import { createFactory } from "hono/factory";

import { getUserId } from "@/server/repositories/auth";
import { getUserSubscription } from "@/server/repositories/subscription";
import { getStripeClient } from "@/server/utils/subscription/stripe";
import { getAppBaseUrl } from "@/utils/app-url";

const factory = createFactory();

/** Stripeのカスタマーポータルへのリンクを発行する */
const handler = factory.createHandlers(async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return c.json({ error: "決済機能が利用できません" } as const, 503);
    }

    const subscription = await getUserSubscription(userId);

    if (!subscription.stripeCustomerId) {
      return c.json({ error: "契約情報が見つかりません" } as const, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/user/plan`,
    });

    return c.json({ url: session.url } as const);
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return c.json({ error: "契約管理ページの作成に失敗しました" } as const, 500);
  }
});

export default handler;
