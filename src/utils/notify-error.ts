import { notifications } from "@mantine/notifications";

import { PLAN_LIMIT_REACHED } from "@/models/subscription";

/** APIがエラー時に返す本文の形 */
type ApiErrorBody = {
  code?: unknown;
  title?: unknown;
  error?: unknown;
};

/**
 * 例外からAPIのエラー本文を取り出す
 *
 * HonoのparseResponseは、レスポンスが成功でない場合にdetail.dataへ本文を格納した例外を投げます。
 *
 * @param error 捕捉した例外
 * @returns エラー本文（取り出せない場合はnull）
 */
const extractApiErrorBody = (error: unknown): ApiErrorBody | null => {
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return null;
  }

  const detail = error.detail;
  if (typeof detail !== "object" || detail === null || !("data" in detail)) {
    return null;
  }

  const data = detail.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  return data;
};

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
