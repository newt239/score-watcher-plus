import Stripe from "stripe";

import { getProductIdByPlanCode } from "./config";

import type { PlanCode } from "./config";

import type { BillingIntervalType, PlanPricesType } from "@/models/subscription";

let stripeClient: Stripe | null = null;

/**
 * Stripeクライアントを取得する
 *
 * 環境変数が未設定の場合はnullを返し、呼び出し側で課金機能を無効として扱えるようにします。
 *
 * @returns Stripeクライアント（未設定の場合はnull）
 */
export const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
};

/**
 * Product IDと課金間隔から対象のPriceを取得する
 *
 * 価格IDは環境変数で持たず、Productに紐づくPriceの中から課金間隔が一致するものを選びます。
 *
 * @param stripe Stripeクライアント
 * @param productId StripeのProduct ID
 * @param interval 課金間隔
 * @returns 該当するPrice（見つからない場合はnull）
 */
export const findPriceByInterval = async (
  stripe: Stripe,
  productId: string,
  interval: BillingIntervalType
) => {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });

  return prices.data.find((price) => price.recurring?.interval === interval) ?? null;
};

/**
 * プランの月払い・週払いの価格を取得する
 *
 * Stripeが未設定の場合やProductが見つからない場合は、各間隔をnullとして返します。
 *
 * @param planCode プランコード
 * @returns 課金間隔ごとの価格
 */
export const getPlanPrices = async (planCode: PlanCode): Promise<PlanPricesType> => {
  const empty: PlanPricesType = { month: null, week: null };

  const stripe = getStripeClient();
  const productId = getProductIdByPlanCode(planCode);

  if (!stripe || !productId) {
    return empty;
  }

  try {
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });

    const pick = (interval: BillingIntervalType) => {
      const price = prices.data.find((p) => p.recurring?.interval === interval);
      if (!price || price.unit_amount === null) {
        return null;
      }
      return { amount: price.unit_amount, currency: price.currency } as const;
    };

    return { month: pick("month"), week: pick("week") };
  } catch (error) {
    console.error("Failed to fetch plan prices:", error);
    return empty;
  }
};
