import { Group, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import ButtonLink from "@/components/ButtonLink";
import Link from "@/components/Link";
import { userContext } from "@/context";
import { getGames } from "@/server/repositories/game";

import GameListControl from "./_components/GameListControl/GameListControl";
import GameListGrid from "./_components/GameListGrid/GameListGrid";
import GameListTable from "./_components/GameListTable/GameListTable";
import ImportGame from "./_components/ImportGame/ImportGame";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "ゲーム一覧 - Score Watcher" },
  { name: "robots", content: "noindex" },
];

/** ゲーム一覧ページ */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);
  const searchParams = new URL(request.url).searchParams;

  const displayMode = searchParams.get("display") === "table" ? "table" : "grid";
  const orderType = searchParams.get("order") === "name" ? "name" : "last_open";

  // APIレスポンスと同じ形式に揃えるため、日付はISO文字列へ変換する
  const games = (await getGames(user.id)).map((game) => ({
    ...game,
    updatedAt: game.updatedAt.toISOString(),
  }));

  const orderedGameList = games.sort((prev, cur) => {
    if (orderType === "last_open") {
      if (prev.updatedAt > cur.updatedAt) return -1;
      if (prev.updatedAt < cur.updatedAt) return 1;
      return 0;
    } else {
      if (prev.name < cur.name) return -1;
      if (prev.name > cur.name) return 1;
      return 0;
    }
  });

  return { displayMode, orderedGameList } as const;
};

const GamesPage = ({ loaderData }: Route.ComponentProps) => {
  const { displayMode, orderedGameList } = loaderData;

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>ゲーム</Title>
        <Group gap="sm">
          <ImportGame />
          <ButtonLink href="/rules" leftSection={<IconPlus size={16} />}>
            新しいゲームを作成
          </ButtonLink>
        </Group>
      </Group>
      <GameListControl />
      {orderedGameList.length === 0 ? (
        <p>
          作成済みのゲームはありません。
          <Link href="/rules">形式一覧</Link>
          ページから新しいゲームを作ることが出来ます。
        </p>
      ) : displayMode === "grid" ? (
        <GameListGrid gameList={orderedGameList} />
      ) : (
        <GameListTable gameList={orderedGameList} />
      )}
    </>
  );
};

export default GamesPage;
