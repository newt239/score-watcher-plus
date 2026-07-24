import { getUser } from "@/utils/auth/auth-helpers";

import RuleList from "./_components/RuleList/RuleList";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "形式一覧 - Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/rules" },
];

/** ゲーム作成にはログインが必要なため、導線の出し分けにログイン状態だけ取得する */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request.headers);

  return { isLoggedIn: Boolean(user) } as const;
};

const RulesPage = ({ loaderData }: Route.ComponentProps) => {
  return <RuleList isLoggedIn={loaderData.isLoggedIn} />;
};

export default RulesPage;
