import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { GetViewerBoardDataParamSchema } from "@/models/game";
import { buildBoardData } from "@/server/utils/board-data";
import { consumeRateLimit, getClientIdentifier } from "@/server/utils/rate-limit";
import { cacheBoardData, getCachedBoardData } from "@/utils/cache/cache-service";

import { getPublicGameById } from "../../repositories/game";

const factory = createFactory();

/** 観戦ページのポーリング間隔を踏まえた、1分あたりの上限リクエスト数 */
const VIEWER_RATE_LIMIT_PER_MINUTE = 120;

/** 公開ゲームのボードデータを取得（認証不要・viewer用） */
const handler = factory.createHandlers(
  zValidator("param", GetViewerBoardDataParamSchema),
  async (c) => {
    try {
      const { gameId } = c.req.valid("param");

      const { allowed, retryAfterSeconds } = consumeRateLimit(
        `viewer:${gameId}:${getClientIdentifier(c.req.raw.headers)}`,
        VIEWER_RATE_LIMIT_PER_MINUTE
      );

      if (!allowed) {
        c.header("Retry-After", String(retryAfterSeconds));
        return c.json(
          {
            error: `アクセスが集中しています。${retryAfterSeconds}秒ほど待ってから再度お試しください`,
          } as const,
          429
        );
      }

      // 同じゲームへのアクセスはCDNでまとめて処理させる
      c.header("Cache-Control", "public, s-maxage=2, stale-while-revalidate=10");

      // まずキャッシュからデータを取得
      const cachedData = await getCachedBoardData(gameId);

      if (cachedData) {
        return c.json({
          data: cachedData,
        } as const);
      }

      // キャッシュにない場合は、ゲームが公開設定かどうかを確認
      const gameData = await getPublicGameById(gameId);

      if (!gameData) {
        return c.json(
          {
            error: "ゲームが見つからないか、非公開に設定されています",
          } as const,
          404
        );
      }

      // キャッシュが無い場合はその場で組み立てて返し、次回以降のためにキャッシュへ保存する
      const boardData = buildBoardData(gameData);
      await cacheBoardData(gameId, boardData);

      return c.json({
        data: boardData,
      } as const);
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
