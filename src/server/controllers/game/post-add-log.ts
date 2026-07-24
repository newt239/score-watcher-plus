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
    const userId = await getUserId();

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const logData = c.req.valid("json");
    const logId = await addGameLog(logData, userId);

    const gameData = await getGameById(logData.gameId, userId);

    // 公開ゲームの場合はスコアを計算し直して観戦用キャッシュを更新する
    await refreshBoardCache(gameData);

    // Discord Webhook通知を送信（勝ち抜け通知）
    if (gameData) {
      try {
        await sendDiscordWinnerNotification(gameData);
      } catch (discordError) {
        // Discord通知の失敗は非致命的エラーとして扱う
        console.error("Discord notification failed:", discordError);
      }
    }

    return c.json({ logId } as const, 201);
  } catch (error) {
    console.error("Error adding cloud game log:", error);
    return c.json({ error: "サーバーエラーが発生しました" } as const, 500);
  }
});

export default handler;
