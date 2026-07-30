import Changelog from "./_components/Changelog/Changelog";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "アップデート履歴 - Score Watcher" },
  {
    tagName: "link",
    rel: "canonical",
    href: "https://plus.score-watcher.com/changelog",
  },
];

const ChangelogPage = () => {
  return <Changelog />;
};

export default ChangelogPage;
