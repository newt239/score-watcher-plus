import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { defaultUserPreferences } from "@/models/user-preference";
import { DBClient } from "@/utils/drizzle/client";
import {
  account,
  game,
  gameLog,
  gamePlayer,
  gameTag,
  player,
  playerTag,
  quizQuestion,
  quizSet,
  session,
  tag,
  user,
  userPreference,
} from "@/utils/drizzle/schema";

import type { UpdateUserPreferencesRequestType } from "@/models/user-preference";

/**
 * ユーザー設定を取得
 *
 * @param userId ユーザーID
 * @returns ユーザー設定または null
 */
export const findUserPreferencesByUserId = async (userId: string) => {
  try {
    const preferences = await DBClient.select()
      .from(userPreference)
      .where(eq(userPreference.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      return null;
    }

    const pref = preferences[0];
    return {
      theme: pref.theme,
      showWinthroughPopup: pref.showWinthroughPopup,
      showBoardHeader: pref.showBoardHeader,
      showQn: pref.showQn,
      showSignString: pref.showSignString,
      reversePlayerInfo: pref.reversePlayerInfo,
      wrongNumber: pref.wrongNumber,
    };
  } catch (error) {
    console.error("Failed to find user preferences:", error);
    throw error;
  }
};

/**
 * ユーザー設定を取得（存在しない場合はデフォルト値を返す）
 *
 * @param userId ユーザーID
 * @returns ユーザー設定
 */
export const getUserPreferences = async (userId: string) => {
  try {
    const preferences = await findUserPreferencesByUserId(userId);
    return preferences || defaultUserPreferences;
  } catch (error) {
    console.error("Failed to get user preferences:", error);
    return defaultUserPreferences;
  }
};

/**
 * ユーザー設定を更新
 *
 * @param userId ユーザーID
 * @param updates 更新データ
 * @returns 更新成功の真偽値
 */
export const updateUserPreferencesByUserId = async (
  userId: string,
  updates: UpdateUserPreferencesRequestType
) => {
  try {
    const updateData: Partial<typeof userPreference.$inferInsert> = {
      ...updates,
      updatedAt: new Date(),
    };

    await DBClient.update(userPreference).set(updateData).where(eq(userPreference.userId, userId));

    return true;
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    throw error;
  }
};

/**
 * ユーザー設定が存在するかチェック
 *
 * @param userId ユーザーID
 * @returns 存在する場合true
 */
export const existsUserPreferencesByUserId = async (userId: string) => {
  try {
    const preferences = await DBClient.select()
      .from(userPreference)
      .where(eq(userPreference.userId, userId))
      .limit(1);

    return preferences.length > 0;
  } catch (error) {
    console.error("Failed to check user preferences existence:", error);
    throw error;
  }
};

/**
 * ユーザー設定が存在しない場合、デフォルト値で新規作成する
 *
 * @param userId ユーザーID
 * @returns 作成されたかどうかの真偽値
 */
export const ensureUserPreferences = async (userId: string) => {
  try {
    // 既存の設定が存在するかチェック
    const exists = await existsUserPreferencesByUserId(userId);
    if (exists) {
      return false; // 新規作成されなかった
    }

    // 新規作成
    const now = new Date();
    await DBClient.insert(userPreference).values({
      id: nanoid(),
      userId: userId,
      theme: defaultUserPreferences.theme,
      showWinthroughPopup: defaultUserPreferences.showWinthroughPopup,
      showBoardHeader: defaultUserPreferences.showBoardHeader,
      showQn: defaultUserPreferences.showQn,
      showSignString: defaultUserPreferences.showSignString,
      reversePlayerInfo: defaultUserPreferences.reversePlayerInfo,
      wrongNumber: defaultUserPreferences.wrongNumber,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  } catch (error) {
    console.error("Failed to ensure user preferences:", error);
    throw error;
  }
};

/**
 * ユーザーと関連するすべてのデータを削除する（退会処理）
 *
 * ゲーム・プレイヤー・問題などの保存データと認証情報をまとめて削除します。
 *
 * @param userId ユーザーID
 */
export const deleteUserWithRelatedData = async (userId: string) => {
  try {
    // 参照関係の子側から順に削除する
    await DBClient.delete(gameLog).where(eq(gameLog.userId, userId));
    await DBClient.delete(gamePlayer).where(eq(gamePlayer.userId, userId));
    await DBClient.delete(gameTag).where(eq(gameTag.userId, userId));
    await DBClient.delete(game).where(eq(game.userId, userId));
    await DBClient.delete(playerTag).where(eq(playerTag.userId, userId));
    await DBClient.delete(player).where(eq(player.userId, userId));
    await DBClient.delete(tag).where(eq(tag.userId, userId));
    await DBClient.delete(quizQuestion).where(eq(quizQuestion.userId, userId));
    await DBClient.delete(quizSet).where(eq(quizSet.userId, userId));
    await DBClient.delete(userPreference).where(eq(userPreference.userId, userId));
    await DBClient.delete(session).where(eq(session.userId, userId));
    await DBClient.delete(account).where(eq(account.userId, userId));
    await DBClient.delete(user).where(eq(user.id, userId));

    return true;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw error;
  }
};
