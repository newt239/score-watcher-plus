import { NonRetriableError } from "@tanstack/offline-transactions";

import { extractApiErrorBody, extractApiErrorStatus } from "@/utils/hono/error";
import { notifyApiError } from "@/utils/notify-error";

const NON_RETRIABLE_STATUSES = [400, 401, 403, 404, 409, 422];

export const isNonRetriableApiError = (error: unknown) => {
  const status = extractApiErrorStatus(error);

  return status !== null && NON_RETRIABLE_STATUSES.includes(status);
};

export const toOfflineMutationError = (error: unknown): Error => {
  if (!isNonRetriableApiError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  notifyApiError(error, "操作を保存できませんでした");

  const body = extractApiErrorBody(error);
  const message = typeof body?.error === "string" ? body.error : String(error);

  return new NonRetriableError(message);
};
