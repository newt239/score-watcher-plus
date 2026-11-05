import type { PlanCodeType } from "@/models/subscription";

export type PlanCode = PlanCodeType;

/** プランごとの上限値 */
export type PlanLimits = {
  /** 表示名 */
  name: string;
  /** 作成できるゲーム数 */
  game: number;
  /** 作成できるプレイヤー数 */
  player: number;
  /** 作成できる問題数 */
  quiz: number;
  /** 観戦ページの1分あたりのリクエスト上限 */
  viewerRateLimitPerMinute: number;
};

/** プランごとの設定（DBではなくコードで管理する） */
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: {
    name: "フリー",
    game: 10,
    player: 50,
    quiz: 200,
    viewerRateLimitPerMinute: 60,
  },
  plus: {
    name: "プラス",
    game: 100,
    player: 500,
    quiz: 2000,
    viewerRateLimitPerMinute: 1000,
  },
};

/** 契約情報が無いユーザーに適用するプラン */
export const DEFAULT_PLAN_CODE: PlanCode = "free";

export const LIMIT_GRACE_DAYS = 7;

export type CreationLimits = Pick<PlanLimits, "game" | "player" | "quiz">;

export const isLimitGraceActive = (limitGraceUntil: Date | null, now: Date) =>
  limitGraceUntil !== null && limitGraceUntil.getTime() > now.getTime();

export const resolveCreationLimits = (
  planCode: PlanCode,
  limitGraceUntil: Date | null,
  now: Date
): CreationLimits => {
  const { game, player, quiz } = isLimitGraceActive(limitGraceUntil, now)
    ? PLAN_LIMITS.plus
    : PLAN_LIMITS[planCode];

  return { game, player, quiz } as const;
};

export const canStartLimitGrace = (
  planCode: PlanCode,
  limitGraceUntil: Date | null,
  isBillingAvailable: boolean
) => isBillingAvailable && planCode === DEFAULT_PLAN_CODE && limitGraceUntil === null;

export const getLimitGraceUntil = (now: Date) =>
  new Date(now.getTime() + LIMIT_GRACE_DAYS * 24 * 60 * 60 * 1000);

/**
 * StripeのProduct IDからプランコードを解決する
 *
 * @param productId StripeのProduct ID
 * @returns 対応するプランコード（対応が無い場合はfree）
 */
export const resolvePlanCodeByProductId = (productId: string | null | undefined): PlanCode => {
  if (productId && productId === process.env.STRIPE_PRODUCT_PLUS) {
    return "plus";
  }
  return DEFAULT_PLAN_CODE;
};

/**
 * プランコードに対応するStripeのProduct IDを取得する
 *
 * @param planCode プランコード
 * @returns Product ID（未設定の場合はundefined）
 */
export const getProductIdByPlanCode = (planCode: PlanCode) => {
  return planCode === "plus" ? process.env.STRIPE_PRODUCT_PLUS : process.env.STRIPE_PRODUCT_FREE;
};
