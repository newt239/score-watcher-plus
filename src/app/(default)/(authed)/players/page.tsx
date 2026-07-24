import type { Metadata } from "next";

import { parseResponse } from "hono/client";
import { notFound } from "next/navigation";

import { createApiClientOnServer } from "@/utils/hono/server";

import ManagePlayer from "./_components/ManagePlayer";

export const metadata: Metadata = {
  title: "プレイヤー管理",
  alternates: {
    canonical: "https://plus.score-watcher.com/players",
  },
};

const OnlinePlayerPage = async () => {
  const apiClient = await createApiClientOnServer();

  const initialPlayers = await parseResponse(apiClient.players.$get({ query: {} }));
  if ("error" in initialPlayers) {
    return notFound();
  }

  return <ManagePlayer initialPlayers={initialPlayers} />;
};

export default OnlinePlayerPage;
