import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { createRequestHandler, RouterContextProvider } from "react-router";

import { cloudflareContext } from "../src/context";
import apiApp from "../src/server";
import { SENTRY_DSN } from "../src/utils/sentry";

// Hono RPCのクライアントは `${origin}/api` をベースURLにしているため、
// ここでbasePathを付けてマウントする
const honoApp = new Hono<{ Bindings: Env }>({ strict: false }).basePath("/api");
honoApp.route("/", apiApp);

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

/**
 * 旧オンライン版URL（/online/...）から現行URLへの恒久リダイレクトを解決する
 *
 * 以前は next.config.ts の redirects() で定義していた。
 *
 * @param url リクエストのURL
 * @returns リダイレクト先のパス。対象外の場合はnull
 */
const resolveLegacyOnlineRedirect = (url: URL): string | null => {
  if (url.pathname === "/online") {
    return `/games${url.search}`;
  }
  if (url.pathname.startsWith("/online/")) {
    return `${url.pathname.slice("/online".length)}${url.search}`;
  }

  return null;
};

export default Sentry.withSentry(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1,
    enabled: import.meta.env.PROD,
  }),
  {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);

      const legacyRedirect = resolveLegacyOnlineRedirect(url);
      if (legacyRedirect) {
        return Response.redirect(new URL(legacyRedirect, url).toString(), 301);
      }

      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
        return honoApp.fetch(request, env, ctx);
      }

      const context = new RouterContextProvider();
      context.set(cloudflareContext, { env, ctx });

      return requestHandler(request, context);
    },
  } satisfies ExportedHandler<Env>
);
