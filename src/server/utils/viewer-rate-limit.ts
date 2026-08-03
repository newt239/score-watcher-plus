import { getViewerRateKey } from "@/utils/cache/cache-keys";
import { getFromKV, putToKV } from "@/utils/cache/cloudflare-kv";

/** レート集計に使うKVの有効期限（秒）。1分バケットが少し過ぎてから自然消滅させる */
const RATE_KEY_TTL_SECONDS = 120;

/**
 * リクエストヘッダーからクライアントのIPを取り出す
 *
 * @param headers リクエストヘッダー
 * @returns クライアントのIP（判別できない場合は"unknown"）
 */
export const getClientIp = (headers: Headers): string => {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
};

/**
 * クライアントのIPをハッシュ化する
 *
 * 個人を特定しないよう、平文のIPは保持せずキーの一部としてのみ使用します。
 *
 * @param ip クライアントのIP
 * @returns SHA-256ハッシュの先頭16文字（16進）
 */
export const hashClientIp = async (ip: string): Promise<string> => {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
};

/** 現在時刻から1分バケットの識別子（yyyymmddHHmm）を組み立てる */
const getMinuteBucket = (now: Date): string => {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${min}`;
};

/**
 * 観戦ページへのアクセス回数を1分バケットで数える
 *
 * Cloudflare KVで集計するため厳密な原子性はありませんが、分散環境でも インスタンスをまたいで概ね一貫した集計ができます。上限との比較は呼び出し側で行います。
 *
 * @param gameId 対象のゲームID
 * @param ipHash ハッシュ化したクライアント識別子
 * @returns 今回を含むアクセス回数と、集計がリセットされるまでの秒数
 */
export const consumeViewerRateLimit = async (gameId: string, ipHash: string) => {
  const now = new Date();
  const minuteBucket = getMinuteBucket(now);
  const key = getViewerRateKey(gameId, ipHash, minuteBucket);

  const stored = await getFromKV(key);
  const previous = stored ? Number.parseInt(stored, 10) : 0;
  const count = (Number.isNaN(previous) ? 0 : previous) + 1;

  await putToKV(key, String(count), RATE_KEY_TTL_SECONDS);

  const retryAfterSeconds = Math.max(1, 60 - now.getUTCSeconds());

  return { count, retryAfterSeconds } as const;
};
