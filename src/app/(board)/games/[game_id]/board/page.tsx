import type { Metadata } from "next";

import { parseResponse } from "hono/client";
import { redirect } from "next/navigation";

import { getUser } from "@/utils/auth/auth-helpers";
import { createApiClientOnServer } from "@/utils/hono/server";

import Board from "./_components/Board/Board";

import type { BoardQuizType } from "@/models/game";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "クラウド得点表示",
  robots: {
    index: false,
  },
};

const BoardPage = async ({ params }: { params: Promise<{ game_id: string }> }) => {
  const { game_id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const apiClient = await createApiClientOnServer();

  const [gameData, playersData, logsData, preferencesData] = await Promise.all([
    parseResponse(
      apiClient.games[":gameId"].$get({
        param: { gameId: game_id },
      })
    ),
    parseResponse(
      apiClient.games[":gameId"].players.$get({
        param: { gameId: game_id },
      })
    ),
    parseResponse(
      apiClient.games[":gameId"].logs.$get({
        param: { gameId: game_id },
      })
    ),
    parseResponse(
      apiClient["user"][":user_id"].preferences.$get({
        param: { user_id: user.id },
      })
    ),
  ]);

  if ("error" in gameData || "error" in playersData || "error" in logsData) {
    return null;
  }

  // preferencesがエラーの場合はnullで渡す
  const preferences = "error" in preferencesData ? null : preferencesData.preferences;

  // 問題セットが紐づいている場合のみ、問題文を出題順に取得する
  const quizSetName = gameData.data.quizSetName;
  let quizList: BoardQuizType[] = [];
  if (quizSetName) {
    const quizesData = await parseResponse(
      apiClient.quizes.$get({ query: { setName: quizSetName, limit: "1000" } })
    );
    if (!("error" in quizesData) && "quizes" in quizesData.data) {
      quizList = quizesData.data.quizes.map((quiz) => ({
        question: quiz.question,
        answer: quiz.answer,
      }));
    }
  }

  return (
    <Board
      gameId={game_id}
      user={user}
      initialGame={gameData.data}
      initialPreferences={preferences}
      quizList={quizList}
    />
  );
};

export default BoardPage;
