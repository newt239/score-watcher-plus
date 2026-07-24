/** Cloudflare KV操作ラッパー */

type KVCredentials = {
  accountId: string;
  namespaceId: string;
  apiToken: string;
};

/**
 * Cloudflare KVへのアクセスに必要な設定を取得する
 *
 * @returns 設定が揃っていれば認証情報、未設定であればnull
 */
const getCredentials = (): KVCredentials | null => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const apiToken = process.env.CLOUDFLARE_KV_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    console.warn("Cloudflare KV credentials not configured");
    return null;
  }

  return { accountId, namespaceId, apiToken };
};

/** 指定したキーに対応するCloudflare KVのエンドポイントを組み立てる */
const buildValueUrl = ({ accountId, namespaceId }: KVCredentials, key: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;

/** Cloudflare KVからデータを取得 */
export const getFromKV = async (key: string): Promise<string | null> => {
  try {
    const credentials = getCredentials();
    if (!credentials) {
      return null;
    }

    const response = await fetch(buildValueUrl(credentials, key), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`KV GET failed: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Failed to get from KV: ${key}`, error);
    return null;
  }
};

/** Cloudflare KVにデータを保存 */
export const putToKV = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  try {
    const credentials = getCredentials();
    if (!credentials) {
      return false;
    }

    const body = new FormData();
    body.append("value", value);
    if (ttl) {
      body.append("expiration_ttl", ttl.toString());
    }

    const response = await fetch(buildValueUrl(credentials, key), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`KV PUT failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to put to KV: ${key}`, error);
    return false;
  }
};

/** Cloudflare KVからデータを削除 */
export const deleteFromKV = async (key: string): Promise<boolean> => {
  try {
    const credentials = getCredentials();
    if (!credentials) {
      return false;
    }

    const response = await fetch(buildValueUrl(credentials, key), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`KV DELETE failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete from KV: ${key}`, error);
    return false;
  }
};
