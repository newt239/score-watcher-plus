import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PLAN_LIMITS } from "./config";

const CONTROLLERS_DIR = join(process.cwd(), "src/server/controllers");

const listControllerFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listControllerFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });

const toRelative = (path: string) => path.replace(`${CONTROLLERS_DIR}/`, "");

const readController = (relativePath: string) =>
  readFileSync(join(CONTROLLERS_DIR, relativePath), "utf8");

describe("プラン上限ガードの適用範囲", () => {
  it("checkCreationLimitを呼ぶのは作成系の5エンドポイントだけ", () => {
    const callers = listControllerFiles(CONTROLLERS_DIR)
      .filter((path) => readFileSync(path, "utf8").includes("checkCreationLimit"))
      .map(toRelative)
      .sort();

    expect(callers).toEqual([
      "game/post-create.ts",
      "game/post-import.ts",
      "migration/post-import.ts",
      "player/post-create.ts",
      "quiz/post-create.ts",
    ]);
  });

  it.each(["game/post-add-log.ts", "game/patch-update-log.ts", "game/delete-log.ts"])(
    "%s はプラン上限の対象外（アウトボックスの再送が恒久エラーになり盤面が巻き戻るため）",
    (relativePath) => {
      const source = readController(relativePath);

      expect(source).not.toContain("checkCreationLimit");
      expect(source).not.toContain("buildPlanLimitError");
    }
  );

  it("PLAN_LIMITSにログ用の上限を持たせない", () => {
    for (const limits of Object.values(PLAN_LIMITS)) {
      expect(Object.keys(limits)).not.toContain("log");
    }
  });

  it("ログ取得APIは行を間引かない（コレクションの同期元は常に全件を返す）", () => {
    const source = readController("game/get-logs.ts");

    expect(source).not.toContain("visibleCount");
    expect(source).not.toContain("slice");
    expect(source).not.toContain("limit");
  });
});
