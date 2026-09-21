import { createContext, useContext } from "react";

import type { GameLogRowType } from "@/models/game";

import type { Collection } from "@tanstack/db";

export type BoardDbContextValue = {
  logsCollection: Collection<GameLogRowType, string>;
  runLogMutation: (mutate: () => void) => void;
  pausePolling: (paused: boolean) => void;
};

export const BoardDbContext = createContext<BoardDbContextValue | null>(null);

export const useBoardDb = () => {
  const value = useContext(BoardDbContext);

  if (!value) {
    throw new Error("useBoardDb は BoardDbProvider の内側で使用してください");
  }

  return value;
};
