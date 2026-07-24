/** 本番環境のアプリURL */
export const PRODUCTION_APP_URL = "https://plus.score-watcher.com";

/** ローカル開発環境のアプリURL */
const LOCAL_APP_URL = "http://localhost:3000";

/**
 * Cloudflare Workersのプレビュー環境（*.workers.dev）を判定するパターン
 *
 * プレビューはデプロイごとにURLが変わるため、個別に列挙せずパターンで許可します。
 */
export const WORKERS_DEV_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/;

/**
 * アプリのベースURLを解決する
 *
 * 明示的に指定された VITE_APP_URL を最優先し、無い場合はローカル開発環境のURLを返します。
 *
 * @returns アプリのベースURL（末尾スラッシュなし）
 */
export const getAppBaseUrl = () => {
  const appUrl = import.meta.env.VITE_APP_URL;

  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }

  return LOCAL_APP_URL;
};

/**
 * 認証・CORSで信頼するオリジンの一覧を組み立てる
 *
 * 本番ドメインとローカル開発環境は常に含めます。Workersのプレビュー環境は URLが固定されないため、この一覧ではなく WORKERS_DEV_ORIGIN_PATTERN で判定します。
 *
 * @returns 信頼するオリジンの配列
 */
export const getTrustedOrigins = (): string[] => {
  return Array.from(new Set<string>([PRODUCTION_APP_URL, LOCAL_APP_URL, getAppBaseUrl()]));
};
