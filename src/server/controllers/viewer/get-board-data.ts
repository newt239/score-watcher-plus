import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { GetViewerBoardDataParamSchema } from "@/models/game";
import { buildBoardData } from "@/server/utils/board-data";
import { cacheBoardData, getCachedBoardData } from "@/utils/cache/cache-service";

import { getPublicGameById } from "../../repositories/game";

const factory = createFactory();

/** 公開ゲームのボードデータを取得（認証不要・viewer用） */
const handler = factory.createHandlers(
  zValidator("param", GetViewerBoardDataParamSchema),
  async (c) => {
    try {
      const { gameId } = c.req.valid("param");

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
