/** リクエスト元ごとのアクセス回数（1分バケット） */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** バケットの有効期間（ミリ秒） */
const WINDOW_MS = 60 * 1000;

/**
 * 期限切れのバケットを取り除く
 *
 * サーバーレス環境ではインスタンスが短命なため厳密な掃除は不要ですが、 長時間動き続ける環境でメモリが増え続けないようにします。
 */
const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

/**
 * 現在の1分間のアクセス回数を1つ増やす
 *
 * インスタンス内のメモリだけで数えるため厳密な制御はできませんが、 単一の配信先へ短時間に 大量のリクエストが集中する状況を緩和できます。上限との比較は、上限値を決められる呼び出し側で
 * 行ってください。
 *
 * @param key 集計の単位となるキー（例: ゲームIDとIPの組み合わせ）
 * @returns 今回を含むアクセス回数と、集計がリセットされるまでの秒数
 */
export const consumeRateLimit = (key: string) => {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    buckets.set(key, { count: 1, resetAt });
    return { count: 1, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) } as const;
  }

  bucket.count += 1;

  return {
    count: bucket.count,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  } as const;
};

/**
 * リクエストヘッダーからクライアントを識別する文字列を取り出す
 *
 * 個人を特定しないよう、IPアドレスはそのまま保持せずキーの一部としてのみ使用します。
 *
 * @param headers リクエストヘッダー
 * @returns クライアントの識別子
 */
export const getClientIdentifier = (headers: Headers) => {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
};
