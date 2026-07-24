import { startTransition, StrictMode } from "react";

import * as Sentry from "@sentry/react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { SENTRY_DSN, SENTRY_TUNNEL_PATH } from "@/utils/sentry";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: import.meta.env.PROD,
  // 広告ブロッカーによる遮断を避けるため自ドメイン経由で送信する
  tunnel: SENTRY_TUNNEL_PATH,
  tracesSampleRate: 1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
