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
 * 1分あたりのアクセス回数を制限する
 *
 * インスタンス内のメモリだけで判定するため厳密な制御はできませんが、 単一の配信先へ短時間に大量のリクエストが集中する状況を緩和できます。
 *
 * @param key 制限の単位となるキー（例: ゲームIDとIPの組み合わせ）
 * @param limitPerMinute 1分あたりに許可するリクエスト数
 * @returns 許可されたかどうかと、超過時の待機秒数
 */
export const consumeRateLimit = (key: string, limitPerMinute: number) => {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 } as const;
  }

  bucket.count += 1;

  if (bucket.count > limitPerMinute) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    } as const;
  }

  return { allowed: true, retryAfterSeconds: 0 } as const;
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
