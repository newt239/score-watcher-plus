declare global {
  // Google Tag Manager のスニペットが定義するキュー（グローバル宣言はvarでのみ可能）
  var dataLayer: unknown[] | undefined;
}

/**
 * Google Tag Manager のdataLayerへイベントを送る
 *
 * `@next/third-parties/google` の `sendGAEvent` を置き換えるためのもので、 GTMが読み込まれていない環境では何もしません。
 *
 * @param event 送信するイベント
 */
export const sendGAEvent = (event: Record<string, unknown>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
};
