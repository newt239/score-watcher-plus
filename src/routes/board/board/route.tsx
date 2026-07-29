import { data } from "react-router";

import ThemeSync from "@/components/ThemeSync";
import { userContext } from "@/context";
import { authMiddleware } from "@/middleware/auth";
import { getGameById } from "@/server/repositories/game";
import { getQuizesWithPagination } from "@/server/repositories/quiz";
import { getUserPreferences } from "@/server/repositories/user";
import { serializeGameForCompute } from "@/server/utils/board-data";

import Board from "./_components/Board/Board";

import type { Route } from "./+types/route";

import type { BoardQuizType } from "@/models/game";

/** (authed)グループ配下ではないため、このルートで個別に認証をガードする */
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export const meta: Route.MetaFunction = () => [
  { title: "クラウド得点表示 - Score Watcher" },
  { name: "robots", content: "noindex" },
];

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  const [game, preferences] = await Promise.all([
    getGameById(params.game_id, user.id),
    getUserPreferences(user.id),
  ]);

  if (!game) {
    throw data(null, { status: 404 });
  }

  // 問題セットが紐づいている場合のみ、問題文を出題順に取得する
  let quizList: BoardQuizType[] = [];
  if (game.quizSetName) {
    const quizes = await getQuizesWithPagination(user.id, 1000, 0, undefined, game.quizSetName);
    quizList = quizes.quizes.map((quiz) => ({
      question: quiz.question,
      answer: quiz.answer,
    }));
  }

  return { user, game: serializeGameForCompute(game).game, preferences, quizList } as const;
};

const BoardPage = ({ params, loaderData }: Route.ComponentProps) => {
  const { user, game, preferences, quizList } = loaderData;

  return (
    <>
      <ThemeSync theme={preferences.theme} />
      <Board
        gameId={params.game_id}
        user={user}
        initialGame={game}
        initialPreferences={preferences}
        quizList={quizList}
      />
    </>
  );
};

export default BoardPage;
