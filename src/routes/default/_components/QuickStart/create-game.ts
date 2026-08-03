import { parseResponse } from "hono/client";

import createApiClient from "@/utils/hono/browser";
import { rules } from "@/utils/rules";

import type { RuleNames } from "@/models/game";

export const PENDING_QUICKSTART_KEY = "scorew-pending-quickstart";

export type QuickStartIntent = {
  rule: RuleNames;
  players: number;
  withPlayers: boolean;
};

export const createGameWithPlayers = async (
  rule: RuleNames,
  players: number,
  withPlayers: boolean
): Promise<string> => {
  const apiClient = createApiClient();

  const result = await parseResponse(
    apiClient["games"].$post({
      json: [{ name: rules[rule].name, ruleType: rule }],
    })
  );

  if ("error" in result) {
    throw new Error(String(result.error));
  }

  const gameId = result.data.ids[0];

  if (withPlayers && players > 0) {
    const createdPlayers = await parseResponse(
      apiClient.players.$post({
        json: Array.from({ length: players }, (_, i) => ({
          name: `プレイヤー${i + 1}`,
        })),
      })
    );

    if ("success" in createdPlayers && createdPlayers.success) {
      await Promise.all(
        createdPlayers.data.ids.map((playerId, i) =>
          parseResponse(
            apiClient.games[":gameId"].players.$post({
              param: { gameId },
              json: { playerId, displayOrder: i },
            })
          )
        )
      );
    }
  }

  return gameId;
};
