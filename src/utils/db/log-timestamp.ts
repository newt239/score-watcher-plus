let lastIssuedMs = 0;

export const nextLogTimestamp = (): number => {
  lastIssuedMs = Math.max(Date.now(), lastIssuedMs + 1);

  return lastIssuedMs;
};
