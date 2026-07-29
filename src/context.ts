import { createContext } from "react-router";

import type { User } from "@/utils/auth/auth";

/**
 * Cloudflare Workers のバインディングと実行コンテキスト
 *
 * リクエストごとにWorkerのエントリで設定し、loader / action / middleware から `context.get(cloudflareContext)` で参照します。
 */
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();

/**
 * ログイン中のユーザー
 *
 * 認証必須ルートでは authMiddleware が設定するため、loader からは必ず取得できます。
 */
export const userContext = createContext<User>();
