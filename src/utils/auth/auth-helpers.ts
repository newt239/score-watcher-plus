import { auth } from "./auth";

/**
 * リクエストヘッダーからセッションを取得する
 *
 * @param headers リクエストのヘッダー
 * @returns セッション。未ログインや取得に失敗した場合はnull
 */
export const getSession = async (headers: Headers) => {
  try {
    return await auth.api.getSession({ headers });
  } catch (error) {
    console.error("Failed to get session:", error);

    return null;
  }
};

/**
 * リクエストヘッダーからログイン中のユーザーを取得する
 *
 * @param headers リクエストのヘッダー
 * @returns ユーザー。未ログインや取得に失敗した場合はnull
 */
export const getUser = async (headers: Headers) => {
  const session = await getSession(headers);

  return session?.user ?? null;
};
