import { NonRetriableError } from "@tanstack/offline-transactions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLAN_LIMIT_REACHED } from "@/models/subscription";

const notifyApiError = vi.hoisted(() => vi.fn());

vi.mock("@/utils/notify-error", () => ({ notifyApiError }));

const { isNonRetriableApiError, toOfflineMutationError } = await import("./offline-error");

const buildDetailedError = (statusCode: number, data: unknown) =>
  Object.assign(new Error(`${statusCode} Error`), { statusCode, detail: { data } });

describe("toOfflineMutationError", () => {
  beforeEach(() => {
    notifyApiError.mockClear();
  });

  it("プラン上限の403は恒久エラーとして扱い、通知を出す", () => {
    const error = buildDetailedError(403, {
      code: PLAN_LIMIT_REACHED,
      title: "ゲームの作成上限に達しました",
      error: "フリープランで作成できるゲームは10件までです",
      actionUrl: "/user/plan",
    });

    const converted = toOfflineMutationError(error);

    expect(converted).toBeInstanceOf(NonRetriableError);
    expect(converted.message).toBe("フリープランで作成できるゲームは10件までです");
    expect(notifyApiError).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 404, 409, 422])("%dは恒久エラーとして扱う", (statusCode) => {
    const converted = toOfflineMutationError(buildDetailedError(statusCode, { error: "だめ" }));

    expect(converted).toBeInstanceOf(NonRetriableError);
  });

  it.each([408, 425, 429, 500, 502, 503, 504])("%dは再試行対象として扱う", (statusCode) => {
    const error = buildDetailedError(statusCode, { error: "あとで" });
    const converted = toOfflineMutationError(error);

    expect(converted).not.toBeInstanceOf(NonRetriableError);
    expect(converted).toBe(error);
    expect(notifyApiError).not.toHaveBeenCalled();
  });

  it("ネットワーク例外は再試行対象として扱う", () => {
    const error = new TypeError("Failed to fetch");
    const converted = toOfflineMutationError(error);

    expect(converted).toBe(error);
    expect(notifyApiError).not.toHaveBeenCalled();
  });

  it("Errorでない値もErrorに包んで再試行対象にする", () => {
    const converted = toOfflineMutationError("壊れた");

    expect(converted).toBeInstanceOf(Error);
    expect(converted).not.toBeInstanceOf(NonRetriableError);
  });
});

describe("isNonRetriableApiError", () => {
  it("statusCodeを持たない例外は再試行対象と判定する", () => {
    expect(isNonRetriableApiError(new Error("boom"))).toBe(false);
    expect(isNonRetriableApiError(null)).toBe(false);
    expect(isNonRetriableApiError({ statusCode: "403" })).toBe(false);
  });
});
