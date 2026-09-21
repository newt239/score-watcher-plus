import { type MiddlewareFunction, redirect } from "react-router";

import { userContext } from "@/context";
import { getUser } from "@/utils/auth/auth-helpers";

/**
 * 認証必須ルートのガード
 *
 * 未ログインの場合は元のパスを next に添えて /sign-in へリダイレクトし、ログイン済みの場合は userContext にユーザーを載せて後続の loader
 * から参照できるようにします。
 */
export const authMiddleware: MiddlewareFunction<Response> = async ({ request, context }) => {
  const user = await getUser(request.headers);

  if (!user) {
    const { pathname, search } = new URL(request.url);

    throw redirect(`/sign-in?next=${encodeURIComponent(`${pathname}${search}`)}`);
  }

  context.set(userContext, user);
};
