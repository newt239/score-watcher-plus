type ApiErrorBody = {
  code?: unknown;
  title?: unknown;
  error?: unknown;
  actionUrl?: unknown;
};

export const extractApiErrorBody = (error: unknown): ApiErrorBody | null => {
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

export const extractApiErrorStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return null;
  }

  return typeof error.statusCode === "number" ? error.statusCode : null;
};

export type { ApiErrorBody };
