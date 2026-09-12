import { and, eq, inArray } from "drizzle-orm";

import { auth } from "@/utils/auth/auth";
import {
  DBClient,
  account as accountTable,
  game as gameTable,
  gameLog as gameLogTable,
  gamePlayer as gamePlayerTable,
  gameTag as gameTagTable,
  player as playerTable,
  playerPlayerTag as playerPlayerTagTable,
  playerTag as playerTagTable,
  quizQuestion as quizQuestionTable,
  quizSet as quizSetTable,
  session as sessionTable,
  tag as tagTable,
  user as userTable,
  userPreference as userPreferenceTable,
  userSubscription as userSubscriptionTable,
} from "@/utils/drizzle/client";

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

/**
 * E2Eテスト用ユーザーがサインインできる状態かを調べる
 *
 * @param email 調査対象のメールアドレス
 * @returns Userが無ければ"missing"、credential accountが欠けていれば"broken"、揃っていれば"ready"
 */
export const getTestUserState = async (email: string) => {
  const users = await DBClient.select().from(userTable).where(eq(userTable.email, email)).limit(1);
  if (users.length === 0) {
    return "missing" as const;
  }

  const accounts = await DBClient.select()
    .from(accountTable)
    .where(and(eq(accountTable.userId, users[0].id), eq(accountTable.providerId, "credential")))
    .limit(1);

  return accounts.length === 0 ? ("broken" as const) : ("ready" as const);
};

/**
 * E2Eテスト用ユーザーと、そのユーザーが持つ全データを削除する
 *
 * Userを参照する行が残っていると外部キー制約でuserを削除できず、accountだけ消えて サインインもサインアップもできない状態になるため、依存関係の順に漏れなく削除します。
 *
 * @param email 削除対象のメールアドレス
 * @returns 削除した場合はtrue、対象が存在しない場合はfalse
 */
export const deleteTestUser = async (email: string) => {
  const testUsers = await DBClient.select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (testUsers.length === 0) {
    return false;
  }

  const userId = testUsers[0].id;
  const playerIds = DBClient.select({ id: playerTable.id })
    .from(playerTable)
    .where(eq(playerTable.userId, userId));
  const playerTagIds = DBClient.select({ id: playerTagTable.id })
    .from(playerTagTable)
    .where(eq(playerTagTable.userId, userId));

  await DBClient.delete(gameLogTable).where(eq(gameLogTable.userId, userId));
  await DBClient.delete(gamePlayerTable).where(eq(gamePlayerTable.userId, userId));
  await DBClient.delete(gameTagTable).where(eq(gameTagTable.userId, userId));
  await DBClient.delete(playerPlayerTagTable).where(
    inArray(playerPlayerTagTable.playerId, playerIds)
  );
  await DBClient.delete(playerPlayerTagTable).where(
    inArray(playerPlayerTagTable.playerTagId, playerTagIds)
  );
  await DBClient.delete(gameTable).where(eq(gameTable.userId, userId));
  await DBClient.delete(playerTable).where(eq(playerTable.userId, userId));
  await DBClient.delete(playerTagTable).where(eq(playerTagTable.userId, userId));
  await DBClient.delete(tagTable).where(eq(tagTable.userId, userId));
  await DBClient.delete(quizQuestionTable).where(eq(quizQuestionTable.userId, userId));
  await DBClient.delete(quizSetTable).where(eq(quizSetTable.userId, userId));
  await DBClient.delete(userSubscriptionTable).where(eq(userSubscriptionTable.userId, userId));
  await DBClient.delete(userPreferenceTable).where(eq(userPreferenceTable.userId, userId));
  await DBClient.delete(sessionTable).where(eq(sessionTable.userId, userId));
  await DBClient.delete(accountTable).where(eq(accountTable.userId, userId));
  await DBClient.delete(userTable).where(eq(userTable.id, userId));

  return true;
};
