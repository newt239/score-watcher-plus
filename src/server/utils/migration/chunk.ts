/**
 * 配列を指定した件数ごとに分割する
 *
 * Cloudflare Workersのサブリクエスト上限を避けるため、一括insertを適度な行数に区切るのに使います。
 *
 * @param items 分割する配列
 * @param size 1チャンクあたりの件数
 * @returns 分割後の配列
 */
export const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};
