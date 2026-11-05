import { describe, expect, it } from "vitest";

import { clampLogTimestamp } from "./game-log";

describe("clampLogTimestamp", () => {
  const now = new Date("2026-09-21T12:00:00.000Z").getTime();

  it("許容範囲内のクライアント時刻はそのまま採用する", () => {
    expect(clampLogTimestamp(now - 1000, now).getTime()).toBe(now - 1000);
    expect(clampLogTimestamp(now + 1000, now).getTime()).toBe(now + 1000);
  });

  it("ちょうど5分のずれは採用する", () => {
    expect(clampLogTimestamp(now - 5 * 60 * 1000, now).getTime()).toBe(now - 5 * 60 * 1000);
    expect(clampLogTimestamp(now + 5 * 60 * 1000, now).getTime()).toBe(now + 5 * 60 * 1000);
  });

  it("5分を超えてずれた時刻はサーバー時刻で置き換える", () => {
    expect(clampLogTimestamp(now - 5 * 60 * 1000 - 1, now).getTime()).toBe(now);
    expect(clampLogTimestamp(now + 5 * 60 * 1000 + 1, now).getTime()).toBe(now);
  });

  it("数値でない時刻はサーバー時刻で置き換える", () => {
    expect(clampLogTimestamp(Number.NaN, now).getTime()).toBe(now);
    expect(clampLogTimestamp(Number.POSITIVE_INFINITY, now).getTime()).toBe(now);
  });
});
