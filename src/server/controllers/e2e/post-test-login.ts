import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { TestLoginRequestSchema } from "@/models/e2e";
import { deleteTestUser, getTestUserState } from "@/server/repositories/auth";
import { auth } from "@/utils/auth/auth";

const factory = createFactory();

/** テスト専用ログインエンドポイント E2Eテストでのみ使用される固定クレデンシャルでのログイン機能 */
export default factory.createHandlers(zValidator("json", TestLoginRequestSchema), async (c) => {
  // 本番環境では無効
  if (import.meta.env.PROD) {
    return c.json({ error: "このエンドポイントは利用できません" }, 403);
  }

  const { email, password } = c.req.valid("json");

  // テストアカウントのパターンチェック
  const TEST_EMAIL_PATTERN = /^e2e-test@example\.com$/;
  const TEST_PASSWORD = "test123456";

  if (!TEST_EMAIL_PATTERN.test(email) || password !== TEST_PASSWORD) {
    return c.json({ error: "認証情報が正しくありません" }, 401);
  }

  // Better Auth APIを使用してサインインし、署名付きセッションcookieをそのまま転送する。
  // asResponseではなくreturnHeadersを使うことで、レスポンス本文に型がついたまま
  // set-cookieヘッダーも取得できる
  const signIn = async () =>
    auth.api.signInEmail({
      body: { email, password },
      headers: c.req.raw.headers,
      returnHeaders: true,
    });

  // credential accountを失ったuser行が残っているとサインアップもサインインも失敗するため、
  // その状態のときだけ作り直す。正常なユーザーのデータを消さないよう状態を確認してから分岐する
  const signInOrRecreate = async () => {
    try {
      return await signIn();
    } catch (error) {
      const state = await getTestUserState(email);
      if (state === "ready") {
        throw error;
      }
      if (state === "broken") {
        await deleteTestUser(email);
      }

      await auth.api.signUpEmail({
        body: { email, password, name: "E2Eテストユーザー" },
        headers: c.req.raw.headers,
      });

      return await signIn();
    }
  };

  try {
    const { headers: signInHeaders, response: signInResult } = await signInOrRecreate();

    const setCookieHeader = signInHeaders.get("set-cookie");
    if (setCookieHeader) {
      c.header("set-cookie", setCookieHeader);
    }

    return c.json({
      user: signInResult.user,
      message: "テストユーザー作成・サインイン完了",
    } as const);
  } catch (error) {
    console.error("Failed to sign in test user:", error);

    return c.json({ error: "サインインに失敗しました" }, 500);
  }
});
