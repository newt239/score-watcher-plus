import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { PreviewLocalDataImportRequestSchema } from "@/models/migration";
import { getUserId } from "@/server/repositories/auth";
import { listExistingPlayers } from "@/server/repositories/migration";
import { getSubscriptionStatus } from "@/server/repositories/subscription";
import { LIMIT_GRACE_DAYS, PLAN_LIMITS } from "@/server/utils/subscription/config";
import { findMatchedPlayerIds } from "@/utils/migration/local-data";

import type { PreviewLocalDataImportResponseType } from "@/models/migration";

const factory = createFactory();

const handler = factory.createHandlers(
  zValidator("json", PreviewLocalDataImportRequestSchema),
  async (c) => {
    try {
      const userId = await getUserId(c.req.raw.headers);

      if (!userId) {
        return c.json({ error: "認証が必要です" } as const, 401);
      }

      const { data } = c.req.valid("json");
      const status = await getSubscriptionStatus(userId);
      const existingPlayers = await listExistingPlayers(userId);
      const { game, player, quiz } = PLAN_LIMITS.plus;

      const response: PreviewLocalDataImportResponseType = {
        usage: status.usage,
        limits: {
          game: status.limits.game,
          player: status.limits.player,
          quiz: status.limits.quiz,
        },
        graceLimits: { game, player, quiz },
        canStartLimitGrace: status.limitGrace.canStart,
        limitGraceDays: LIMIT_GRACE_DAYS,
        matchedPlayerIds: findMatchedPlayerIds(data, existingPlayers),
      };

      return c.json(response);
    } catch (error) {
      console.error("Error previewing local data import:", error);
      return c.json({ error: "取り込み内容の確認に失敗しました" } as const, 500);
    }
  }
);

export default handler;
