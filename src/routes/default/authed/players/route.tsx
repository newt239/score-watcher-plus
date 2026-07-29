import { userContext } from "@/context";
import { getPlayers } from "@/server/repositories/player";

import ManagePlayer from "./_components/ManagePlayer";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "プレイヤー管理 - Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/players" },
];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  return { initialPlayers: await getPlayers(user.id) } as const;
};

const OnlinePlayerPage = ({ loaderData }: Route.ComponentProps) => {
  return <ManagePlayer initialPlayers={loaderData.initialPlayers} />;
};

export default OnlinePlayerPage;
