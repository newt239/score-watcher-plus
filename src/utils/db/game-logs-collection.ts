import { collectionOptions } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { parseResponse } from "hono/client";

import { GameLogRowSchema } from "@/models/game";
import createApiClient from "@/utils/hono/browser";

import type { QueryClient } from "@tanstack/query-core";

export const GAME_LOG_POLLING_INTERVAL_MS = 3000;

export const getGameLogsCollectionId = (gameId: string) => `game-logs-${gameId}`;

type GameLogsCollectionParams = {
  gameId: string;
  isPollingPaused: () => boolean;
};

export const createGameLogsCollectionOptions = ({
  gameId,
  isPollingPaused,
}: GameLogsCollectionParams) =>
  collectionOptions(getGameLogsCollectionId(gameId), (client) =>
    queryCollectionOptions({
      id: getGameLogsCollectionId(gameId),
      queryKey: ["game-logs", gameId],
      queryClient: client.requireDependency<QueryClient>("queryClient"),
      queryFn: async () => {
        const result = await parseResponse(
          createApiClient().games[":gameId"].logs.$get({ param: { gameId } })
        );

        return result.logs;
      },
      schema: GameLogRowSchema,
      getKey: (log) => log.id,
      enabled: typeof window !== "undefined",
      refetchInterval: () => (isPollingPaused() ? false : GAME_LOG_POLLING_INTERVAL_MS),
      staleTime: GAME_LOG_POLLING_INTERVAL_MS,
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    })
  );
