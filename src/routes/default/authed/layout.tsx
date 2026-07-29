import { Outlet } from "react-router";

import ThemeSync from "@/components/ThemeSync";
import { userContext } from "@/context";
import { authMiddleware } from "@/middleware/auth";
import { getUserPreferences } from "@/server/repositories/user";

import type { Route } from "./+types/layout";

/** 未ログインの場合は /sign-in へリダイレクトする */
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

/** 保存済みの表示設定を反映するためテーマだけ先に取得する */
export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);
  const preferences = await getUserPreferences(user.id);

  return { theme: preferences.theme } as const;
};

const AuthedLayout = ({ loaderData }: Route.ComponentProps) => {
  return (
    <>
      <ThemeSync theme={loaderData.theme} />
      <Outlet />
    </>
  );
};

export default AuthedLayout;
