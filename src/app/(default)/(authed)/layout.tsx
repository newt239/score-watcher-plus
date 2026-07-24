import { redirect } from "next/navigation";

import ThemeSync from "@/app/_components/ThemeSync";
import { defaultUserPreferences } from "@/models/user-preference";
import { getUser } from "@/utils/auth/auth-helpers";
import { createApiClientOnServer } from "@/utils/hono/server";

export const dynamic = "force-dynamic";

type AuthedLayoutProps = {
  children: React.ReactNode;
};

/** 認証必須ページのレイアウト ユーザーが未ログインの場合は/sign-inにリダイレクトする */
const AuthedLayout = async ({ children }: AuthedLayoutProps) => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 保存済みの表示設定を反映するためテーマだけ先に取得する
  let theme = defaultUserPreferences.theme;
  try {
    const apiClient = await createApiClientOnServer();
    const response = await apiClient.user[":user_id"].preferences.$get({
      param: { user_id: user.id },
    });
    const data = await response.json();
    if ("preferences" in data) {
      theme = data.preferences.theme;
    }
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
  }

  return (
    <>
      <ThemeSync theme={theme} />
      {children}
    </>
  );
};

export default AuthedLayout;
