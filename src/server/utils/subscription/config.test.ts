import { afterEach, describe, expect, it } from "vitest";

import { PLAN_LIMIT_REACHED } from "@/models/subscription";

import {
  DEFAULT_PLAN_CODE,
  LIMIT_GRACE_DAYS,
  PLAN_LIMITS,
  canStartLimitGrace,
  getLimitGraceUntil,
  isLimitGraceActive,
  resolveCreationLimits,
  resolvePlanCodeByProductId,
} from "./config";
import { buildPlanLimitError } from "./limit-response";

describe("プラン設定", () => {
  const originalProductPlus = process.env.STRIPE_PRODUCT_PLUS;

  afterEach(() => {
    process.env.STRIPE_PRODUCT_PLUS = originalProductPlus;
  });

  it("プラスプランの上限はフリープランより大きい", () => {
    expect(PLAN_LIMITS.plus.game).toBeGreaterThan(PLAN_LIMITS.free.game);
    expect(PLAN_LIMITS.plus.player).toBeGreaterThan(PLAN_LIMITS.free.player);
    expect(PLAN_LIMITS.plus.quiz).toBeGreaterThan(PLAN_LIMITS.free.quiz);
    expect(PLAN_LIMITS.plus.viewerRateLimitPerMinute).toBeGreaterThan(
      PLAN_LIMITS.free.viewerRateLimitPerMinute
    );
  });

  it("設定されたProduct IDからプラスプランを解決する", () => {
    process.env.STRIPE_PRODUCT_PLUS = "prod_plus";

    expect(resolvePlanCodeByProductId("prod_plus")).toBe("plus");
  });

  it("対応しないProduct IDはデフォルトのプランとして扱う", () => {
    process.env.STRIPE_PRODUCT_PLUS = "prod_plus";

    expect(resolvePlanCodeByProductId("prod_unknown")).toBe(DEFAULT_PLAN_CODE);
    expect(resolvePlanCodeByProductId(null)).toBe(DEFAULT_PLAN_CODE);
  });

  it("上限到達時のレスポンスに判別用のコードと案内文を含む", () => {
    const error = buildPlanLimitError("game", "free", 10, 10);

    expect(error.code).toBe(PLAN_LIMIT_REACHED);
    expect(error.title).toContain("ゲーム");
    expect(error.error).toContain("10");
    expect(error.actionUrl).toBe("/user/plan");
  });
});

describe("上限超過の猶予期間", () => {
  const now = new Date("2026-11-05T00:00:00Z");

  it("猶予期間中はフリープランでもプラスプランの作成上限で判定する", () => {
    expect(resolveCreationLimits("free", getLimitGraceUntil(now), now)).toEqual({
      game: PLAN_LIMITS.plus.game,
      player: PLAN_LIMITS.plus.player,
      quiz: PLAN_LIMITS.plus.quiz,
    });
  });

  it("猶予期間が過ぎるとフリープランの上限に戻る", () => {
    const expired = new Date(now.getTime() - 1);

    expect(isLimitGraceActive(expired, now)).toBe(false);
    expect(resolveCreationLimits("free", expired, now).game).toBe(PLAN_LIMITS.free.game);
  });

  it("猶予期間は7日後に終わる", () => {
    expect(getLimitGraceUntil(now).toISOString()).toBe(
      `2026-11-${String(5 + LIMIT_GRACE_DAYS).padStart(2, "0")}T00:00:00.000Z`
    );
  });

  it("猶予期間を始められるのは決済が有効で、未使用のフリープランだけ", () => {
    expect(canStartLimitGrace("free", null, true)).toBe(true);
    expect(canStartLimitGrace("free", null, false)).toBe(false);
    expect(canStartLimitGrace("plus", null, true)).toBe(false);
    expect(canStartLimitGrace("free", new Date(0), true)).toBe(false);
  });
});
