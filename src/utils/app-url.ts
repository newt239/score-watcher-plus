/** 本番環境のアプリURL */
export const PRODUCTION_APP_URL = "https://plus.score-watcher.com";

/** ローカル開発環境のアプリURL */
const LOCAL_APP_URL = "http://localhost:3000";

/**
 * アプリのベースURLを解決する
 *
 * 明示的に指定された NEXT_PUBLIC_APP_URL を最優先し、次に Vercel のプレビューURL、 いずれも無い場合はローカル開発環境のURLを返します。
 *
 * @returns アプリのベースURL（末尾スラッシュなし）
 */
export const getAppBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
  }
  return LOCAL_APP_URL;
};

/**
 * 認証・CORSで信頼するオリジンの一覧を組み立てる
 *
 * 本番ドメインとローカル開発環境は常に含め、Vercelのプレビュー環境で動作している場合は そのURLも追加します。
 *
 * @returns 信頼するオリジンの配列
 */
export const getTrustedOrigins = (): string[] => {
  const origins = new Set<string>([PRODUCTION_APP_URL, LOCAL_APP_URL, getAppBaseUrl()]);

  if (process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`);
  }
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return Array.from(origins);
};
