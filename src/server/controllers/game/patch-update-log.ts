import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { UpdateGameLogRequestJsonSchema, UpdateGameLogRequestParamSchema } from "@/models/game";
import { getUserId } from "@/server/repositories/auth";
import { getGameById, getGameLogById, updateGameLogPlayers } from "@/server/repositories/game";
import { refreshBoardCache } from "@/server/utils/board-data";

const factory = createFactory();

/** ゲームログの解答者を更新する */
const handler = factory.createHandlers(
  zValidator("param", UpdateGameLogRequestParamSchema),
  zValidator("json", UpdateGameLogRequestJsonSchema),
  async (c) => {
    try {
      const userId = await getUserId(c.req.raw.headers);

      if (!userId) {
        return c.json({ error: "認証が必要です" } as const, 401);
      }

      const { logId } = c.req.valid("param");
      const { playerId } = c.req.valid("json");

      const logInfo = await getGameLogById(logId, userId);
      if (!logInfo?.gameId) {
        return c.json({ error: "ログが見つかりません" } as const, 404);
      }

      const updated = await updateGameLogPlayers(logId, playerId, userId);

      await refreshBoardCache(await getGameById(logInfo.gameId, userId));

      return c.json({ updated } as const);
    } catch (error) {
      console.error("Error updating game log:", error);
      return c.json({ error: "サーバーエラーが発生しました" } as const, 500);
    }
  }
);

export default handler;
