import { redirect } from "react-router";

import type { Route } from "./+types/route";

/** /config へのアクセスを /config/rule にリダイレクト */
export const loader = ({ params }: Route.LoaderArgs) => {
  throw redirect(`/games/${params.game_id}/config/rule`);
};
