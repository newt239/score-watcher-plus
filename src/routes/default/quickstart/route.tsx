import { Center, Loader, Stack, Text } from "@mantine/core";
import { redirect } from "react-router";

import { rules } from "@/utils/rules";

import {
  PENDING_QUICKSTART_KEY,
  createGameWithPlayers,
  type QuickStartIntent,
} from "../_components/QuickStart/create-game";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [{ title: "ゲームを作成中 - Score Watcher" }];

export async function clientLoader() {
  const raw = sessionStorage.getItem(PENDING_QUICKSTART_KEY);
  if (!raw) {
    throw redirect("/");
  }
  sessionStorage.removeItem(PENDING_QUICKSTART_KEY);

  let intent: QuickStartIntent;
  try {
    intent = JSON.parse(raw) as QuickStartIntent;
  } catch {
    throw redirect("/");
  }

  if (!(intent.rule in rules)) {
    throw redirect("/");
  }

  let gameId: string;
  try {
    gameId = await createGameWithPlayers(intent.rule, intent.players, intent.withPlayers);
  } catch {
    throw redirect("/");
  }
  throw redirect(`/games/${gameId}/config`);
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text c="dimmed">ゲームを作成しています…</Text>
      </Stack>
    </Center>
  );
}

const QuickStartResume = () => null;

export default QuickStartResume;
