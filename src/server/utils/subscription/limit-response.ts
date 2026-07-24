import { PLAN_LIMIT_REACHED } from "@/models/subscription";

import { PLAN_LIMITS } from "./config";

import type { PlanCode } from "./config";

/** 上限判定の対象となるリソース */
type LimitedResource = "game" | "player" | "quiz";

/** リソースの表示名 */
const RESOURCE_LABELS: Record<LimitedResource, string> = {
  game: "ゲーム",
  player: "プレイヤー",
  quiz: "問題",
};

/**
 * 作成上限に達したときのエラーレスポンスを組み立てる
 *
 * フロントエンドがそのまま通知として表示できる形式で返します。
 *
 * @param resource 上限に達したリソース
 * @param planCode 現在のプラン
 * @param limit 現在のプランでの上限値
 * @param current 現在の件数
 * @returns エラーレスポンスの本文
 */
export const buildPlanLimitError = (
  resource: LimitedResource,
  planCode: PlanCode,
  limit: number,
  current: number
) => {
  const label = RESOURCE_LABELS[resource];

  return {
    code: PLAN_LIMIT_REACHED,
    title: `${label}の作成上限に達しました`,
    error: `${PLAN_LIMITS[planCode].name}プランで作成できる${label}は${limit}件までです（現在${current}件）。不要な${label}を削除するか、プランをアップグレードしてください。`,
    actionUrl: "/user/plan",
    limit,
    current,
  } as const;
};
