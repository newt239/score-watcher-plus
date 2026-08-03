import { z } from "zod";

/** プランコード */
export const planCodes = ["free", "plus"] as const;

/** プランコードのスキーマ */
export const PlanCodeSchema = z.enum(planCodes);

/** プランコードの型 */
export type PlanCodeType = z.infer<typeof PlanCodeSchema>;

/** 課金間隔のスキーマ */
export const BillingIntervalSchema = z.enum(["week", "month"]);

/** Checkoutセッション作成リクエストのスキーマ */
export const CreateCheckoutSessionRequestSchema = z.object({
  planCode: PlanCodeSchema,
  interval: BillingIntervalSchema,
});

/** 課金間隔の型 */
export type BillingIntervalType = z.infer<typeof BillingIntervalSchema>;

/** 契約状態取得レスポンスの型 */
export type GetSubscriptionStatusResponseType = {
  planCode: z.infer<typeof PlanCodeSchema>;
  planName: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    game: number;
    player: number;
    quiz: number;
    viewerRateLimitPerMinute: number;
  };
  usage: {
    game: number;
    player: number;
    quiz: number;
  };
};

/** 上限に達したときにAPIが返すエラーコード */
export const PLAN_LIMIT_REACHED = "PLAN_LIMIT_REACHED";
