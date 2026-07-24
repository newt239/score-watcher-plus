import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { CreateCheckoutSessionRequestSchema } from "@/models/subscription";
import { getUserId } from "@/server/repositories/auth";
import { getUserSubscription, upsertUserSubscription } from "@/server/repositories/subscription";
import { getProductIdByPlanCode } from "@/server/utils/subscription/config";
import { findPriceByInterval, getStripeClient } from "@/server/utils/subscription/stripe";
import { getAppBaseUrl } from "@/utils/app-url";
import { getUser } from "@/utils/auth/auth-helpers";

const factory = createFactory();

/** StripeのCheckoutセッションを作成する */
const handler = factory.createHandlers(
  zValidator("json", CreateCheckoutSessionRequestSchema),
  async (c) => {
    try {
      const userId = await getUserId();

      if (!userId) {
        return c.json({ error: "認証が必要です" } as const, 401);
      }

      const stripe = getStripeClient();
      if (!stripe) {
        return c.json({ error: "決済機能が利用できません" } as const, 503);
      }

      const { planCode, interval } = c.req.valid("json");

      if (planCode === "free") {
        return c.json({ error: "フリープランは購入できません" } as const, 400);
      }

      const productId = getProductIdByPlanCode(planCode);
      if (!productId) {
        return c.json({ error: "プランの設定が見つかりません" } as const, 503);
      }

      const price = await findPriceByInterval(stripe, productId, interval);
      if (!price) {
        return c.json({ error: "選択された支払い方法は利用できません" } as const, 400);
      }

      // 既存のCustomerがあれば再利用し、無ければ作成して紐づける
      const subscription = await getUserSubscription(userId);
      let customerId = subscription.stripeCustomerId;

      if (!customerId) {
        const user = await getUser();
        const customer = await stripe.customers.create({
          email: user?.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await upsertUserSubscription(userId, {
          planCode: subscription.planCode,
          stripeCustomerId: customerId,
        });
      }

      const baseUrl = getAppBaseUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${baseUrl}/user/plan?status=success`,
        cancel_url: `${baseUrl}/user/plan?status=cancel`,
        metadata: { userId, planCode },
      });

      if (!session.url) {
        return c.json({ error: "決済ページの作成に失敗しました" } as const, 500);
      }

      return c.json({ url: session.url } as const);
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      return c.json({ error: "決済ページの作成に失敗しました" } as const, 500);
    }
  }
);

export default handler;
