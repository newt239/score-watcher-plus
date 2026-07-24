import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { GetViewerBoardDataParamSchema } from "@/models/game";
import { getUserSubscription } from "@/server/repositories/subscription";
import { buildBoardData } from "@/server/utils/board-data";
import { consumeRateLimit, getClientIdentifier } from "@/server/utils/rate-limit";
import { PLAN_LIMITS } from "@/server/utils/subscription/config";
import { cacheBoardData, getCachedBoardData } from "@/utils/cache/cache-service";

import { getPublicGameById } from "../../repositories/game";

const factory = createFactory();

/** 同じゲームへのアクセスをCDNでまとめて処理させるためのキャッシュ指定 */
const CACHE_CONTROL = "public, s-maxage=2, stale-while-revalidate=10";

/** 公開ゲームのボードデータを取得（認証不要・viewer用） */
const handler = factory.createHandlers(
  zValidator("param", GetViewerBoardDataParamSchema),
  async (c) => {
    try {
      const { gameId } = c.req.valid("param");

      const { count, retryAfterSeconds } = consumeRateLimit(
        `viewer:${gameId}:${getClientIdentifier(c.req.raw.headers)}`
      );

      // フリープランの上限内であれば、キャッシュだけで応答してデータベースへの問い合わせを避ける
      if (count <= PLAN_LIMITS.free.viewerRateLimitPerMinute) {
        const cachedData = await getCachedBoardData(gameId);

        if (cachedData) {
          c.header("Cache-Control", CACHE_CONTROL);
          return c.json({ data: cachedData } as const);
        }
      }

      // ゲームが公開されているかを確認し、所有者のプランに応じた上限を適用する
      const gameData = await getPublicGameById(gameId);

      if (!gameData) {
        return c.json(
          {
            error: "ゲームが見つからないか、非公開に設定されています",
          } as const,
          404
        );
      }

      const { planCode } = gameData.userId
        ? await getUserSubscription(gameData.userId)
        : ({ planCode: "free" } as const);

      if (count > PLAN_LIMITS[planCode].viewerRateLimitPerMinute) {
        c.header("Retry-After", String(retryAfterSeconds));
        return c.json(
          {
            error: `アクセスが集中しています。${retryAfterSeconds}秒ほど待ってから再度お試しください`,
          } as const,
          429
        );
      }

      c.header("Cache-Control", CACHE_CONTROL);

      // フリープランの上限を超えていた場合はキャッシュを確認していないため、ここで改めて確認する
      const cachedData = await getCachedBoardData(gameId);

      if (cachedData) {
        return c.json({ data: cachedData } as const);
      }

      // キャッシュが無い場合はその場で組み立てて返し、次回以降のためにキャッシュへ保存する
      const boardData = buildBoardData(gameData);
      await cacheBoardData(gameId, boardData);

      return c.json({ data: boardData } as const);
    } catch (error) {
      console.error("Failed to get viewer board data:", error);
      return c.json(
        {
          error: "ボードデータの取得に失敗しました",
        } as const,
        500
      );
    }
  }
);

export default handler;
