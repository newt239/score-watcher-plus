import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DbClient } from "@tanstack/db";
import { startOfflineExecutor } from "@tanstack/offline-transactions";
import { DbProvider } from "@tanstack/react-db";

import { createGameLogsCollectionOptions } from "@/utils/db/game-logs-collection";
import { createGameLogsMutationFn, GAME_LOGS_MUTATION_FN } from "@/utils/db/game-logs-mutation";
import { createBoardQueryClient } from "@/utils/db/query-client";

import { BoardDbContext } from "../../_hooks/use-board-db";

import type { GameLogRowType } from "@/models/game";

import type { OfflineExecutor } from "@tanstack/offline-transactions";

const MAX_OUTBOX_RETRY_COUNT = 10;

type BoardDbProviderProps = {
  gameId: string;
  initialLogs: GameLogRowType[];
  children: React.ReactNode;
};

const BoardDbProvider: React.FC<BoardDbProviderProps> = ({ gameId, initialLogs, children }) => {
  const pollingPausedRef = useRef(false);
  const executorRef = useRef<OfflineExecutor | null>(null);

  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isLeader, setIsLeader] = useState(true);

  const pausePolling = useCallback((paused: boolean) => {
    pollingPausedRef.current = paused;
  }, []);

  const [dbClient] = useState(() => new DbClient({ queryClient: createBoardQueryClient() }));

  const [logsCollection] = useState(() =>
    dbClient.collection(
      createGameLogsCollectionOptions({
        gameId,
        isPollingPaused: () => pollingPausedRef.current,
      }),
      { initialData: initialLogs }
    )
  );

  const [mutationFn] = useState(() => createGameLogsMutationFn(logsCollection.utils));

  useEffect(() => {
    executorRef.current = startOfflineExecutor({
      collections: { gameLogs: logsCollection },
      mutationFns: { [GAME_LOGS_MUTATION_FN]: mutationFn },
      onLeadershipChange: setIsLeader,
      beforeRetry: (transactions) =>
        transactions.filter((transaction) => {
          if (transaction.retryCount <= MAX_OUTBOX_RETRY_COUNT) return true;

          void executorRef.current?.removeFromOutbox(transaction.id);
          return false;
        }),
    });
    setIsOfflineReady(true);

    return () => {
      executorRef.current?.dispose();
      executorRef.current = null;
      setIsOfflineReady(false);
    };
  }, [logsCollection, mutationFn]);

  const runLogMutation = useCallback(
    (mutate: () => void) => {
      const executor = executorRef.current;
      const transaction = executor
        ? executor.createOfflineTransaction({
            mutationFnName: GAME_LOGS_MUTATION_FN,
            autoCommit: false,
          })
        : dbClient.createTransaction({ autoCommit: false, mutationFn });

      transaction.mutate(mutate);
      void transaction.commit().catch((error: unknown) => {
        console.error("Failed to persist game log mutation:", error);
      });
    },
    [dbClient, mutationFn]
  );

  const contextValue = useMemo(
    () => ({
      logsCollection,
      runLogMutation,
      pausePolling,
      offlineState: { isReady: isOfflineReady, isLeader },
      getPendingCount: () => executorRef.current?.getPendingCount() ?? 0,
    }),
    [logsCollection, runLogMutation, pausePolling, isOfflineReady, isLeader]
  );

  return (
    <DbProvider client={dbClient}>
      <BoardDbContext.Provider value={contextValue}>{children}</BoardDbContext.Provider>
    </DbProvider>
  );
};

export default BoardDbProvider;
