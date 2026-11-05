import { createFactory } from "hono/factory";

import { deleteTestUser } from "@/server/repositories/auth";

const factory = createFactory();

/** テスト専用ユーザー削除エンドポイント E2Eテストでのみ使用される */
export default factory.createHandlers(async (c) => {
  // 本番環境では無効
  if (import.meta.env.PROD) {
    return c.json({ error: "このエンドポイントは利用できません" }, 403);
  }

  const TEST_EMAIL = "e2e-test@example.com";

  try {
    const deleted = await deleteTestUser(TEST_EMAIL);

    return c.json({
      message: deleted ? "テストユーザーを削除しました" : "テストユーザーは存在しません",
    } as const);
  } catch (error) {
    console.error("テストユーザー削除エラー:", error);
    return c.json({ error: "テストユーザー削除に失敗しました" }, 500);
  }
});
