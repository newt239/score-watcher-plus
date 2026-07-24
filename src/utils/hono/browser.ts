import { hc } from "hono/client";

import { getAppBaseUrl } from "@/utils/app-url";

import type { APIRouteType } from "@/server";

/**
 * APIのベースURLを解決する
 *
 * ブラウザ上では常に表示中のオリジンを使用します。カスタムドメインとVercelのプレビューURLの どちらでアクセスされてもクロスオリジンにならず、セッションcookieが確実に送信されます。
 *
 * @returns APIのベースURL
 */
const resolveApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return getAppBaseUrl();
  }
  return window.location.origin;
};

/** ブラウザ上で動作するAPIクライアントを作成 */
const createApiClient = () => {
  return hc<APIRouteType>(`${resolveApiBaseUrl()}/api`, {
    init: {
      credentials: "include",
    },
  });
};

export default createApiClient;
