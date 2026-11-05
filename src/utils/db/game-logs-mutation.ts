import { parseResponse } from "hono/client";

import { GameLogRowSchema } from "@/models/game";
import createApiClient from "@/utils/hono/browser";

import { toOfflineMutationError } from "./offline-error";

import type { GameLogRowType } from "@/models/game";

import type { MutationFn } from "@tanstack/db";
import type { QueryCollectionUtils } from "@tanstack/query-db-collection";

export const GAME_LOGS_MUTATION_FN = "syncGameLogs";

type GameLogsCollectionUtils = QueryCollectionUtils<GameLogRowType, string, GameLogRowType>;

const toAddLogRequest = (log: GameLogRowType) => ({
  id: log.id,
  timestamp: new Date(log.timestamp).getTime(),
  gameId: log.gameId ?? "",
  playerId: log.playerId ?? "",
  actionType: log.actionType,
  scoreChange: log.scoreChange ?? 0,
  isSystemAction: log.isSystemAction ?? false,
  panel: log.panel ?? undefined,
  removedPanel: log.removedPanel ?? undefined,
});

export const createGameLogsMutationFn =
  (utils: GameLogsCollectionUtils): MutationFn =>
  async ({ transaction }) => {
    const apiClient = createApiClient();

    for (const mutation of transaction.mutations) {
      try {
        if (mutation.type === "insert") {
          const log = GameLogRowSchema.parse(mutation.modified);

          await parseResponse(apiClient.games.logs.$post({ json: toAddLogRequest(log) }));
          utils.writeUpsert(log);
        } else if (mutation.type === "update") {
          const log = GameLogRowSchema.parse(mutation.modified);

          await parseResponse(
            apiClient.games.logs[":logId"].$patch({
              param: { logId: log.id },
              json: { playerId: log.playerId ?? "" },
            })
          );
          utils.writeUpsert(log);
        } else {
          const logId = String(mutation.key);

          await parseResponse(apiClient.games.logs[":logId"].$delete({ param: { logId } }));
          utils.writeDelete(logId);
        }
      } catch (error) {
        throw toOfflineMutationError(error);
      }
    }
  };
