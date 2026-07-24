/** プランコード */
export const planCodes = ["free", "plus"] as const;

export type PlanCode = (typeof planCodes)[number];

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
