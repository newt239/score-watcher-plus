/** キャッシュキーの命名規則管理 */

/** ボードデータのキャッシュキーを生成 */
export const getBoardCacheKey = (gameId: string): string => {
  return `board_cache:${gameId}`;
};

/** 観戦ページのレート制限用キーを生成（1分バケット単位） */
export const getViewerRateKey = (gameId: string, ipHash: string, minuteBucket: string): string => {
  return `vr:${gameId}:${ipHash}:${minuteBucket}`;
};
