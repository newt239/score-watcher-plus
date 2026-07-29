import { eq } from "drizzle-orm";

import { auth } from "@/utils/auth/auth";
import { DBClient, session, user } from "@/utils/drizzle/client";

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

/** メールアドレスでユーザーを取得 */
export async function getUserByEmail(email: string) {
  const result = await DBClient.select().from(user).where(eq(user.email, email)).limit(1);

  return result[0] || null;
}

/** テスト用ユーザーを作成 */
export async function createTestUser(userData: {
  email: string;
  name: string;
  emailVerified: boolean;
}) {
  const [newUser] = await DBClient.insert(user)
    .values({
      id: crypto.randomUUID(),
      email: userData.email,
      name: userData.name,
      emailVerified: userData.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newUser;
}

/** セッションを作成 */
export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後

  const [newSession] = await DBClient.insert(session)
    .values({
      id: sessionId,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newSession;
}
