import { data } from "react-router";

import { userContext } from "@/context";
import { getGameById } from "@/server/repositories/game";
import { getPlayers } from "@/server/repositories/player";
import { serializeGameForCompute } from "@/server/utils/board-data";

import PlayersConfig from "./_components/PlayersConfig";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [{ title: "プレイヤー設定 - Score Watcher" }];

/** プレイヤー設定ページ */
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  const [game, players] = await Promise.all([
    getGameById(params.game_id, user.id),
    getPlayers(user.id),
  ]);

  if (!game) {
    throw data(null, { status: 404 });
  }

  return { game: serializeGameForCompute(game).game, players } as const;
};

const PlayerPage = ({ params, loaderData }: Route.ComponentProps) => {
  const { game, players } = loaderData;

  return (
    <PlayersConfig
      game_id={params.game_id}
      rule={game.ruleType}
      players={players}
      gamePlayers={game.players}
    />
  );
};

export default PlayerPage;
