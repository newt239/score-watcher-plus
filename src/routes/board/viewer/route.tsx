import { data, isRouteErrorResponse } from "react-router";

import { getPublicGameById } from "@/server/repositories/game";
import { buildBoardData } from "@/server/utils/board-data";
import { cacheBoardData, getCachedBoardData } from "@/utils/cache/cache-service";

import ViewerBoard from "./_components/ViewerBoard/ViewerBoard";
import ViewerHeader from "./_components/ViewerHeader/ViewerHeader";
import ViewerNotFound from "./_components/ViewerNotFound/ViewerNotFound";
import classes from "./page.module.css";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "観戦モード - Score Watcher" },
  { name: "robots", content: "noindex" },
];

/**
 * 初期表示用のボードデータを取得する
 *
 * この後ViewerBoardが /api/viewer/... をポーリングして更新する。レート制限はそちらで かかるため、初期表示ではキャッシュ優先の取得だけを行う。
 */
export const loader = async ({ params }: Route.LoaderArgs) => {
  const cachedData = await getCachedBoardData(params.game_id);
  if (cachedData) {
    return { initialData: cachedData } as const;
  }

  const gameData = await getPublicGameById(params.game_id);
  if (!gameData) {
    throw data(null, { status: 404 });
  }

  const boardData = buildBoardData(gameData);
  await cacheBoardData(params.game_id, boardData);

  return { initialData: boardData } as const;
};

const ViewerPage = ({ params, loaderData }: Route.ComponentProps) => {
  return (
    <div className={classes.container}>
      <ViewerHeader />
      <main className={classes.main}>
        <ViewerBoard gameId={params.game_id} initialData={loaderData.initialData} />
      </main>
    </div>
  );
};

/** 非公開・存在しないゲームIDの場合はID入力フォームを表示する */
export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ViewerNotFound />;
  }

  console.error(error);

  return <ViewerNotFound />;
};

export default ViewerPage;
