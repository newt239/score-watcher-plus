import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { ResetGameLogsRequestParamSchema } from "@/models/game";
import { getUserId } from "@/server/repositories/auth";
import { getGameById, removeAllGameLogs } from "@/server/repositories/game";
import { refreshBoardCache } from "@/server/utils/board-data";
import { sendDiscordResetNotification } from "@/utils/online/discord";

const factory = createFactory();

/** ゲームのログをすべて削除してリセットする */
const handler = factory.createHandlers(
  zValidator("param", ResetGameLogsRequestParamSchema),
  async (c) => {
    try {
      const userId = await getUserId();

      if (!userId) {
        return c.json({ error: "認証が必要です" } as const, 401);
      }

      const { gameId } = c.req.valid("param");

      const gameData = await getGameById(gameId, userId);
      if (!gameData) {
        return c.json({ error: "ゲームが見つかりません" } as const, 404);
      }

      const { deletedCount } = await removeAllGameLogs(gameId, userId);

      // リセット後の状態でキャッシュを作り直す
      await refreshBoardCache(await getGameById(gameId, userId));

      if (deletedCount > 0) {
        try {
          await sendDiscordResetNotification(gameData);
        } catch (discordError) {
          // Discord通知の失敗は非致命的エラーとして扱う
          console.error("Discord reset notification failed:", discordError);
        }
      }

      return c.json({ deletedCount, message: `${deletedCount}件のログを削除しました` } as const);
    } catch (error) {
      console.error("Error resetting game logs:", error);
      return c.json({ error: "サーバーエラーが発生しました" } as const, 500);
    }
  }
);

export default handler;
