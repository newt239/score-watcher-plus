/** Cloudflare KV操作ラッパー */

import { env } from "cloudflare:workers";

/**
 * Cloudflare KVからデータを取得
 *
 * @param key 取得するキー
 * @returns 保存されている文字列。存在しない場合や失敗した場合はnull
 */
export const getFromKV = async (key: string): Promise<string | null> => {
  try {
    return await env.BOARD_CACHE.get(key);
  } catch (error) {
    console.error(`Failed to get from KV: ${key}`, error);

    return null;
  }
};

/**
 * Cloudflare KVにデータを保存
 *
 * @param key 保存するキー
 * @param value 保存する文字列
 * @param ttl 有効期限（秒）。KVの仕様上60秒未満は指定できない
 * @returns 保存に成功したかどうか
 */
export const putToKV = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  try {
    await env.BOARD_CACHE.put(key, value, ttl ? { expirationTtl: ttl } : undefined);

    return true;
  } catch (error) {
    console.error(`Failed to put to KV: ${key}`, error);

    return false;
  }
};

/**
 * Cloudflare KVからデータを削除
 *
 * @param key 削除するキー
 * @returns 削除に成功したかどうか
 */
export const deleteFromKV = async (key: string): Promise<boolean> => {
  try {
    await env.BOARD_CACHE.delete(key);

    return true;
  } catch (error) {
    console.error(`Failed to delete from KV: ${key}`, error);

    return false;
  }
};
