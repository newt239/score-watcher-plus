import { createFactory } from "hono/factory";

import {
  findUserIdByStripeCustomerId,
  upsertUserSubscription,
} from "@/server/repositories/subscription";
import { resolvePlanCodeByProductId } from "@/server/utils/subscription/config";
import { getStripeClient } from "@/server/utils/subscription/stripe";

import type Stripe from "stripe";

const factory = createFactory();

/** サブスクリプションの状態をDBへ反映する */
const applySubscription = async (subscription: Stripe.Subscription) => {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const userId =
    subscription.metadata?.userId || (await findUserIdByStripeCustomerId(customerId)) || null;

  if (!userId) {
    console.error(`No user found for stripe customer: ${customerId}`);
    return;
  }

  const item = subscription.items.data[0];
  const productId = typeof item?.price.product === "string" ? item.price.product : null;
  // 解約や支払い失敗で契約が終了した場合はフリープランへ戻す
  const planCode =
    subscription.status === "canceled" ? "free" : resolvePlanCodeByProductId(productId);

  await upsertUserSubscription(userId, {
    planCode,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: item?.price.id ?? null,
    status: subscription.status,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
};

/** StripeのWebhookを受け取り契約状態を更新する */
const handler = factory.createHandlers(async (c) => {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return c.json({ error: "決済機能が利用できません" } as const, 503);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "署名がありません" } as const, 400);
  }

  let event: Stripe.Event;
  try {
    // 署名の検証には生のリクエストボディが必要
    const payload = await c.req.text();
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Failed to verify stripe webhook signature:", error);
    return c.json({ error: "署名の検証に失敗しました" } as const, 400);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await applySubscription(subscription);
        }
        break;
      }
      default:
        // 対象外のイベントは記録だけして無視する
        break;
    }

    return c.json({ received: true } as const);
  } catch (error) {
    console.error(`Failed to handle stripe webhook (${event.type}):`, error);
    return c.json({ error: "Webhookの処理に失敗しました" } as const, 500);
  }
});

export default handler;
