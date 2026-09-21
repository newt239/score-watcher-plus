import { createContext, useContext } from "react";

import type { GameLogRowType } from "@/models/game";

import type { Collection } from "@tanstack/db";

export type BoardOfflineState = {
  isReady: boolean;
  isLeader: boolean;
};

export type BoardDbContextValue = {
  logsCollection: Collection<GameLogRowType, string>;
  runLogMutation: (mutate: () => void) => void;
  pausePolling: (paused: boolean) => void;
  offlineState: BoardOfflineState;
  getPendingCount: () => number;
};

export const BoardDbContext = createContext<BoardDbContextValue | null>(null);

export const useBoardDb = () => {
  const value = useContext(BoardDbContext);

  if (!value) {
    throw new Error("useBoardDb は BoardDbProvider の内側で使用してください");
  }

  return value;
};
