/// <reference types="vite/client" />

// ImportMetaEnv は vite/client が interface として宣言しているため、
// 宣言マージで拡張するにはここだけ interface を使う必要がある（type では拡張できない）
interface ImportMetaEnv {
  /** アプリの公開URL（本番は https://plus.score-watcher.com） */
  readonly VITE_APP_URL?: string;
  /** アプリのバージョン（アップデート告知モーダルの表示判定に使用） */
  readonly VITE_APP_VERSION?: string;
  /** Google Tag Manager のコンテナID */
  readonly VITE_GTM_ID?: string;
  /** Google Analytics の測定ID */
  readonly VITE_GA_ID?: string;
}
