import { createFactory } from "hono/factory";

import { getSentryIngestTarget } from "@/utils/sentry";

const factory = createFactory();

/**
 * ブラウザから送られたSentryのエンベロープを中継する
 *
 * 広告ブロッカーがSentryのドメインへの直接送信を遮断するため、自ドメインで受けて転送します。 転送先は自プロジェクトに固定し、任意のSentryプロジェクトへの踏み台にならないようにします。
 */
const handler = factory.createHandlers(async (c) => {
  const envelope = await c.req.text();
  // エンベロープの1行目のヘッダーに送信元のDSNが入っている
  const [header] = envelope.split("\n");

  let dsn: URL;
  try {
    const parsedHeader: unknown = JSON.parse(header);
    if (typeof parsedHeader !== "object" || parsedHeader === null || !("dsn" in parsedHeader)) {
      return c.json({ error: "DSNが含まれていません" } as const, 400);
    }
    dsn = new URL(String(parsedHeader.dsn));
  } catch {
    return c.json({ error: "エンベロープの形式が不正です" } as const, 400);
  }

  const { host, projectId } = getSentryIngestTarget();
  if (dsn.hostname !== host || dsn.pathname.replace("/", "") !== projectId) {
    return c.json({ error: "許可されていない転送先です" } as const, 403);
  }

  const response = await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: "POST",
    body: envelope,
    headers: { "Content-Type": "application/x-sentry-envelope" },
  });

  // Sentryのレスポンスをそのまま返す（c.bodyはステータスコードの型が限定されるため素のResponseを使う）
  return new Response(response.body, { status: response.status });
});

export default handler;
