import { auth } from "@/utils/auth/auth";

/**
 * リクエストヘッダーからログイン中のユーザーIDを取得する
 *
 * @param headers リクエストのヘッダー
 * @returns ユーザーID。未ログインの場合はnull
 */
export const getUserId = async (headers: Headers) => {
  // テスト環境での認証バイパス
  const isPlaywrightTest = headers.get("x-playwright-test") === "true";
  const testUserId = headers.get("x-test-user-id");

  if (
    (!import.meta.env.PROD || isPlaywrightTest) &&
    testUserId === process.env.PLAYWRIGHT_TEST_USER_ID
  ) {
    return process.env.PLAYWRIGHT_TEST_USER_ID;
  }

  const session = await auth.api.getSession({ headers });
  if (!session) {
    return null;
  }

  return session.user.id;
};
