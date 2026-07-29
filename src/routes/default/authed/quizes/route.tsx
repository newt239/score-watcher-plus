import { userContext } from "@/context";
import { getQuizes } from "@/server/repositories/quiz";

import ManageQuiz from "./_components/ManageQuiz";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "クイズ問題管理 - Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/quizes" },
];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  return { initialQuizes: await getQuizes(user.id) } as const;
};

const OnlineQuizPage = ({ loaderData }: Route.ComponentProps) => {
  return <ManageQuiz initialQuizes={loaderData.initialQuizes} />;
};

export default OnlineQuizPage;
