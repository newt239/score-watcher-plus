const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export const clampLogTimestamp = (clientMs: number, now: number = Date.now()): Date => {
  if (!Number.isFinite(clientMs) || Math.abs(clientMs - now) > MAX_CLOCK_SKEW_MS) {
    return new Date(now);
  }

  return new Date(clientMs);
};
