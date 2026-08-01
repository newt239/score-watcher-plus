import { createAuthClient } from "better-auth/client";

import { getAppBaseUrl } from "@/utils/app-url";

/**
 * 認証APIのベースURLを解決する
 *
 * ブラウザ上では常に表示中のオリジンを使用します。カスタムドメインとWorkersのプレビューURLの どちらでアクセスされてもクロスオリジンにならず、セッションcookieが確実に送信されます。
 *
 * @returns 認証APIのベースURL
 */
const resolveAuthBaseUrl = () => {
  if (typeof window === "undefined") {
    return getAppBaseUrl();
  }

  return window.location.origin;
};

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  basePath: "/api/auth",
});
