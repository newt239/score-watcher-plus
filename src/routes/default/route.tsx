import { getUser } from "@/utils/auth/auth-helpers";

import Features from "./_components/Features/Features";
import Hero from "./_components/Hero/Hero";
import QuickStart from "./_components/QuickStart/QuickStart";
import Term from "./_components/Term";

import type { Route } from "./+types/route";

// React Routerのmetaは親を上書きするため、rootのtitleもここで明示する
export const meta: Route.MetaFunction = () => [
  { title: "Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/" },
];

/** QuickStartの導線出し分けのためログイン状態だけ取得する */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request.headers);

  return { isLoggedIn: Boolean(user) } as const;
};

const HomePage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <>
      <Hero />
      <QuickStart isLoggedIn={loaderData.isLoggedIn} />
      <Features />
      <Term />
    </>
  );
};

export default HomePage;
