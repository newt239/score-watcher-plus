// Workers（edge）ランタイム向けのHTTP/WebSocketベースのクライアントを使う
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema/index";

/**
 * Drizzleクライアントを生成する
 *
 * Workersではモジュール読み込み時に環境変数（シークレット）がまだ利用できないため、
 * トップレベルではなく初回アクセス時に生成します。
 *
 * @returns Drizzleクライアント
 */
const createDrizzleClient = () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  if (!tursoToken) {
    throw new Error("TURSO_AUTH_TOKEN environment variable is required");
  }

  return drizzle(createClient({ url: tursoUrl, authToken: tursoToken }), { schema });
};

export type DrizzleDB = ReturnType<typeof createDrizzleClient>;

let cachedClient: DrizzleDB | null = null;

/** キャッシュ済みのDrizzleクライアントを返す（無ければ生成する） */
const getDrizzleClient = (): DrizzleDB => {
  cachedClient ??= createDrizzleClient();

  return cachedClient;
};

/**
 * Drizzleクライアント
 *
 * 実際のクライアント生成を初回のプロパティアクセスまで遅延させるためProxyでラップしています。
 * これによりモジュール読み込み時（Worker起動時の検証を含む）に環境変数を要求しなくなります。
 */
export const DBClient = new Proxy({} as DrizzleDB, {
  get(_target, prop) {
    const client = getDrizzleClient();
    const value = Reflect.get(client, prop);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

export * from "./schema";
