import Features from "./_components/Features/Features";
import Hero from "./_components/Hero/Hero";
import Term from "./_components/Term";

import type { Route } from "./+types/route";

// React Routerのmetaは親を上書きするため、rootのtitleもここで明示する
export const meta: Route.MetaFunction = () => [
  { title: "Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/" },
];

const HomePage = () => {
  return (
    <>
      <Hero />
      <Features />
      <Term />
    </>
  );
};

export default HomePage;
