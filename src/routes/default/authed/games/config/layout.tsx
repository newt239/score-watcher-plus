import { data, Outlet } from "react-router";

import { userContext } from "@/context";
import { getGameById } from "@/server/repositories/game";
import { serializeGameForCompute } from "@/server/utils/board-data";

import ConfigHeader from "./_components/ConfigHeader/ConfigHeader";
import ConfigTabs from "./_components/ConfigTabs/ConfigTabs";
import { GameStateProvider } from "./_hooks/useGameState";

import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "ゲーム設定 - Score Watcher" },
  { name: "robots", content: "noindex" },
];

/** 設定ページの共通レイアウト サーバーサイドでゲーム情報を取得し、各コンポーネントに分割 */
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);
  const game = await getGameById(params.game_id, user.id);

  if (!game) {
    throw data(null, { status: 404 });
  }

  return { game: serializeGameForCompute(game).game } as const;
};

const ConfigLayout = ({ params, loaderData }: Route.ComponentProps) => {
  const { game } = loaderData;

  return (
    <GameStateProvider gameId={params.game_id} initialGame={game}>
      <ConfigHeader
        gameId={params.game_id}
        ruleType={game.ruleType}
        playerCount={game.players.length}
        logCount={game.logs.length}
      />
      <ConfigTabs gameId={params.game_id}>
        <Outlet />
      </ConfigTabs>
    </GameStateProvider>
  );
};

export default ConfigLayout;
