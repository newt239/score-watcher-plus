import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { ImportGameRequestSchema } from "@/models/game";
import { getUserId } from "@/server/repositories/auth";
import { importGame } from "@/server/repositories/game";
import { checkCreationLimit } from "@/server/repositories/subscription";
import { buildPlanLimitError } from "@/server/utils/subscription/limit-response";

const factory = createFactory();

/** エクスポートしたJSONからゲームを復元する */
const handler = factory.createHandlers(zValidator("json", ImportGameRequestSchema), async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const importData = c.req.valid("json");

    const limitCheck = await checkCreationLimit(userId, "game", 1);
    if (!limitCheck.allowed) {
      return c.json(
        buildPlanLimitError("game", limitCheck.planCode, limitCheck.limit, limitCheck.current),
        403
      );
    }

    const result = await importGame(importData, userId);

    return c.json(
      {
        ...result,
        message: `${importData.data.name}をインポートしました`,
      } as const,
      201
    );
  } catch (error) {
    console.error("Error importing game:", error);
    return c.json({ error: "ゲームのインポートに失敗しました" } as const, 500);
  }
});

export default handler;
