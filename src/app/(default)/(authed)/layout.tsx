import { redirect } from "next/navigation";

import { getUser } from "@/utils/auth/auth-helpers";

export const dynamic = "force-dynamic";

type AuthedLayoutProps = {
  children: React.ReactNode;
};

/**
 * 認証必須ページのレイアウト
 * ユーザーが未ログインの場合は/sign-inにリダイレクトする
 */
const AuthedLayout = async ({ children }: AuthedLayoutProps) => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <>{children}</>;
};

export default AuthedLayout;
