import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { ImportLocalDataRequestSchema } from "@/models/migration";
import { getUserId } from "@/server/repositories/auth";
import { commitLocalDataImport, prepareLocalDataImport } from "@/server/repositories/migration";
import { checkCreationLimit } from "@/server/repositories/subscription";
import { buildPlanLimitError } from "@/server/utils/subscription/limit-response";

const factory = createFactory();

/** ローカル版から書き出したJSONをまとめて取り込む */
const handler = factory.createHandlers(
  zValidator("json", ImportLocalDataRequestSchema),
  async (c) => {
    try {
      const userId = await getUserId(c.req.raw.headers);

      if (!userId) {
        return c.json({ error: "認証が必要です" } as const, 401);
      }

      const plan = await prepareLocalDataImport(c.req.valid("json"), userId);

      // 部分的に取り込むと再実行時に重複するため、1つでも超過していたら何も書き込まない
      for (const resource of ["game", "player", "quiz"] as const) {
        const limitCheck = await checkCreationLimit(userId, resource, plan.counts[resource]);

        if (!limitCheck.allowed) {
          return c.json(
            buildPlanLimitError(
              resource,
              limitCheck.planCode,
              limitCheck.limit,
              limitCheck.current
            ),
            403
          );
        }
      }

      const result = await commitLocalDataImport(plan);

      return c.json(
        {
          ...result,
          message: `ゲーム${result.gameCount}件、プレイヤー${result.playerCount}件、問題${result.quizCount}件を取り込みました`,
        } as const,
        201
      );
    } catch (error) {
      console.error("Error importing local data:", error);
      return c.json({ error: "データの取り込みに失敗しました" } as const, 500);
    }
  }
);

export default handler;
