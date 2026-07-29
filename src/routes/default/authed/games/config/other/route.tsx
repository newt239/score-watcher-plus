import { Box, Title } from "@mantine/core";
import { data } from "react-router";

import { userContext } from "@/context";
import { getGameById } from "@/server/repositories/game";
import { getQuizes } from "@/server/repositories/quiz";
import { serializeGameForCompute } from "@/server/utils/board-data";
import { getAppBaseUrl } from "@/utils/app-url";

import ConfigInput from "../_components/ConfigInput";
import CopyGame from "./_components/CopyGame";
import DeleteGame from "./_components/DeleteGame";
import ExportGame from "./_components/ExportGame";
import PublicityToggle from "./_components/PublicityToggle";
import ResetGame from "./_components/ResetGame";
import SelectQuizset from "./_components/SelectQuizset";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [{ title: "その他の設定 - Score Watcher" }];

/** その他の設定ページ */
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  const [game, quizes] = await Promise.all([
    getGameById(params.game_id, user.id),
    getQuizes(user.id),
  ]);

  if (!game) {
    throw data(null, { status: 404 });
  }

  return {
    game: serializeGameForCompute(game).game,
    quizsetNames: [...new Set(quizes.map((quiz) => quiz.setName))],
    viewerBaseUrl: getAppBaseUrl(),
  } as const;
};

const OtherPage = ({ loaderData }: Route.ComponentProps) => {
  const { game, quizsetNames, viewerBaseUrl } = loaderData;

  return (
    <Box>
      <SelectQuizset
        game_id={game.id}
        game_quiz={{ setName: game.quizSetName ?? "", offset: game.quizOffset }}
        quizset_names={quizsetNames}
      />
      <Title order={3} mt="xl">
        公開設定
      </Title>
      <PublicityToggle
        gameId={game.id}
        isPublic={game.isPublic}
        gameName={game.name}
        viewerUrl={`${viewerBaseUrl}/viewer/${game.id}`}
      />
      <Title order={3} mt="xl">
        オプション
      </Title>
      <ConfigInput
        gameId={game.id}
        label="Discord Webhook"
        placeholder="https://discord.com/api/webhooks/..."
        value={game.discordWebhookUrl || ""}
        fieldName="discordWebhookUrl"
      />
      <Title order={3} mt="xl">
        ゲーム
      </Title>
      <CopyGame
        gameId={game.id}
        gameName={game.name}
        ruleType={game.ruleType}
        discordWebhookUrl={game.discordWebhookUrl || ""}
      />
      <ExportGame gameId={game.id} ruleType={game.ruleType} />
      <ResetGame gameId={game.id} gameName={game.name} logCount={game.logs.length} />
      <DeleteGame gameId={game.id} gameName={game.name} ruleType={game.ruleType} />
    </Box>
  );
};

export default OtherPage;
