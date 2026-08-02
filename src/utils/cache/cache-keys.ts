/** キャッシュキーの命名規則管理 */

/** ボードデータのキャッシュキーを生成 */
export const getBoardCacheKey = (gameId: string): string => {
  return `board_cache:${gameId}`;
};
