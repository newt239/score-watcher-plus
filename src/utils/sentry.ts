/**
 * SentryのDSN
 *
 * DSNは公開しても問題ない値のため、環境変数ではなくソースに直接持たせています。
 */
export const SENTRY_DSN =
  "https://7f2a3eb9428148c3a475c7b2c4bef92a@o4505277028433920.ingest.us.sentry.io/4505277040033792";

/**
 * ブラウザからのSentryイベントを中継するエンドポイント
 *
 * 広告ブロッカーにSentryへの直接送信を遮断されるため、自ドメインを経由させます。
 */
export const SENTRY_TUNNEL_PATH = "/api/monitoring";

/**
 * DSNからイベントの転送先を組み立てる
 *
 * @returns Sentryのホスト名とプロジェクトID
 */
export const getSentryIngestTarget = () => {
  const dsn = new URL(SENTRY_DSN);

  return {
    host: dsn.hostname,
    projectId: dsn.pathname.replace("/", ""),
  } as const;
};
