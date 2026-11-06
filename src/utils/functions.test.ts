import { describe, expect, it } from "vitest";

import { formatGameProgress } from "./functions";

describe("formatGameProgress", () => {
  it("ログが無いゲームは未開始と表示する", () => {
    expect(formatGameProgress(0)).toBe("未開始");
  });

  it("ゲーム設定画面と同じく次に出題する問題番号を表示する", () => {
    expect(formatGameProgress(4)).toBe("5問目");
  });
});
