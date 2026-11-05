import { describe, expect, it } from "vitest";

import { nextLogTimestamp } from "./log-timestamp";

describe("nextLogTimestamp", () => {
  it("連続して呼んでも必ず単調増加する", () => {
    const issued = Array.from({ length: 100 }, () => nextLogTimestamp());

    for (let i = 1; i < issued.length; i++) {
      expect(issued[i]).toBeGreaterThan(issued[i - 1]);
    }
  });

  it("現在時刻に近い値を返す", () => {
    const before = Date.now();
    const issued = nextLogTimestamp();

    expect(issued).toBeGreaterThanOrEqual(before);
    expect(issued).toBeLessThan(before + 1000);
  });
});
