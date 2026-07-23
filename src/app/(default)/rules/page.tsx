import type { Metadata } from "next";

import { getUser } from "@/utils/auth/auth-helpers";

import RuleList from "./_components/RuleList/RuleList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "形式一覧",
  alternates: {
    canonical: "https://score-watcher.com/rules",
  },
};

const RulesPage = async () => {
  const user = await getUser();

  return <RuleList isLoggedIn={!!user} />;
};

export default RulesPage;
