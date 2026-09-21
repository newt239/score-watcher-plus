import { useCallback, useMemo, useRef, useState } from "react";

import { DbClient } from "@tanstack/db";
import { DbProvider } from "@tanstack/react-db";

import { createGameLogsCollectionOptions } from "@/utils/db/game-logs-collection";
import { createGameLogsMutationFn, GAME_LOGS_MUTATION_FN } from "@/utils/db/game-logs-mutation";
import { createBoardQueryClient } from "@/utils/db/query-client";
import { notifyApiError } from "@/utils/notify-error";

import { BoardDbContext } from "../../_hooks/use-board-db";

import type { GameLogRowType } from "@/models/game";

type BoardDbProviderProps = {
  gameId: string;
  initialLogs: GameLogRowType[];
  children: React.ReactNode;
};

const BoardDbProvider: React.FC<BoardDbProviderProps> = ({ gameId, initialLogs, children }) => {
  const pollingPausedRef = useRef(false);

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

  const runLogMutation = useCallback(
    (mutate: () => void) => {
      const transaction = dbClient.createTransaction({
        autoCommit: false,
        mutationFn,
        metadata: { mutationFnName: GAME_LOGS_MUTATION_FN },
      });

      transaction.mutate(mutate);
      void transaction
        .commit()
        .catch((error: unknown) => notifyApiError(error, "操作を保存できませんでした"));
    },
    [dbClient, mutationFn]
  );

  const contextValue = useMemo(
    () => ({ logsCollection, runLogMutation, pausePolling }),
    [logsCollection, runLogMutation, pausePolling]
  );

  return (
    <DbProvider client={dbClient}>
      <BoardDbContext.Provider value={contextValue}>{children}</BoardDbContext.Provider>
    </DbProvider>
  );
};

export default BoardDbProvider;
