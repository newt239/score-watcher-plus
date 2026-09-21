import { notifications } from "@mantine/notifications";

import { PLAN_LIMIT_REACHED } from "@/models/subscription";
import { extractApiErrorBody } from "@/utils/hono/error";

/**
 * APIエラーを通知として表示する
 *
 * プランの上限に達した場合はサーバーから返された案内文をそのまま表示します。
 *
 * @param error 捕捉した例外
 * @param fallbackMessage 上記で判別できない場合に表示するメッセージ
 */
export const notifyApiError = (error: unknown, fallbackMessage: string) => {
  const body = extractApiErrorBody(error);

  if (body?.code === PLAN_LIMIT_REACHED) {
    notifications.show({
      title: typeof body.title === "string" ? body.title : "上限に達しました",
      message: typeof body.error === "string" ? body.error : fallbackMessage,
      color: "orange",
      autoClose: 15000,
      withCloseButton: true,
    });
    return;
  }

  notifications.show({
    title: "エラー",
    message: typeof body?.error === "string" ? body.error : fallbackMessage,
    color: "red",
    autoClose: 9000,
    withCloseButton: true,
  });
};
