import { createContext } from "react-router";

/**
 * Cloudflare Workers のバインディングと実行コンテキスト
 *
 * リクエストごとにWorkerのエントリで設定し、loader / action / middleware から `context.get(cloudflareContext)` で参照します。
 */
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();
