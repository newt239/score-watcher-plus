import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { AddGameLogRequestSchema } from "@/models/game";
import { getUserId } from "@/server/repositories/auth";
import { addGameLog, getGameById } from "@/server/repositories/game";
import { refreshBoardCache } from "@/server/utils/board-data";
import { sendDiscordWinnerNotification } from "@/utils/online/discord";

const factory = createFactory();

/** ゲームログ追加 */
const handler = factory.createHandlers(zValidator("json", AddGameLogRequestSchema), async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const logData = c.req.valid("json");
    const logId = await addGameLog(logData, userId);

    c.executionCtx.waitUntil(notifyAfterAddLog(logData.gameId, userId));

    return c.json({ logId } as const, 201);
  } catch (error) {
    console.error("Error adding cloud game log:", error);
    return c.json({ error: "サーバーエラーが発生しました" } as const, 500);
  }
});

const notifyAfterAddLog = async (gameId: string, userId: string) => {
  try {
    const gameData = await getGameById(gameId, userId);

    await refreshBoardCache(gameData);

    if (gameData) {
      await sendDiscordWinnerNotification(gameData);
    }
  } catch (error) {
    console.error("Post-processing for cloud game log failed:", error);
  }
};

export default handler;
