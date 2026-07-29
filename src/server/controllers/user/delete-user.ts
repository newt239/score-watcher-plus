import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import { UserIdParamSchema } from "@/models/user-preference";
import { getUserId } from "@/server/repositories/auth";
import { deleteUserWithRelatedData } from "@/server/repositories/user";

const factory = createFactory();

/** アカウントと保存データをすべて削除する（退会） */
const handler = factory.createHandlers(zValidator("param", UserIdParamSchema), async (c) => {
  try {
    const userId = await getUserId(c.req.raw.headers);

    if (!userId) {
      return c.json({ error: "認証が必要です" } as const, 401);
    }

    const { user_id } = c.req.valid("param");

    // 他人のアカウントを削除できないようにする
    if (user_id !== userId) {
      return c.json({ error: "権限がありません" } as const, 403);
    }

    await deleteUserWithRelatedData(userId);

    return c.json({ deleted: true, message: "アカウントを削除しました" } as const);
  } catch (error) {
    console.error("Failed to delete account:", error);
    return c.json({ error: "アカウントの削除に失敗しました" } as const, 500);
  }
});

export default handler;
