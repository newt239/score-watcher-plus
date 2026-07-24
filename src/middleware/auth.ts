import { type MiddlewareFunction, redirect } from "react-router";

import { userContext } from "@/context";
import { getUser } from "@/utils/auth/auth-helpers";

/**
 * 認証必須ルートのガード
 *
 * 未ログインの場合は /sign-in へリダイレクトし、ログイン済みの場合は userContext にユーザーを載せて後続の loader から参照できるようにします。
 */
export const authMiddleware: MiddlewareFunction<Response> = async ({ request, context }) => {
  const user = await getUser(request.headers);

  if (!user) {
    throw redirect("/sign-in");
  }

  context.set(userContext, user);
};
