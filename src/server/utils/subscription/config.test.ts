import { afterEach, describe, expect, it } from "vitest";

import { PLAN_LIMIT_REACHED } from "@/models/subscription";

import { DEFAULT_PLAN_CODE, PLAN_LIMITS, resolvePlanCodeByProductId } from "./config";
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
