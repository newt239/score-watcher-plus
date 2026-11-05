import type { LocalExportFileType } from "@/models/migration";

export const FALLBACK_QUIZ_SET_NAME = "インポート";

export type LocalDataSelection = {
  gameIds: string[];
  quizSetNames: string[];
  playerIds: string[];
};

export const getQuizSetName = (quiz: { set_name?: string | null }) =>
  quiz.set_name?.trim() ? quiz.set_name : FALLBACK_QUIZ_SET_NAME;

export const listQuizSets = (data: LocalExportFileType) => {
  const countByName = new Map<string, number>();

  for (const quiz of data.quizes) {
    const name = getQuizSetName(quiz);
    countByName.set(name, (countByName.get(name) ?? 0) + 1);
  }

  return [...countByName.entries()].map(([name, count]) => ({ name, count }) as const);
};

export const listLocalPlayers = (data: LocalExportFileType) => {
  const players = new Map<string, string>();

  for (const localPlayer of data.players) {
    if (!players.has(localPlayer.id)) players.set(localPlayer.id, localPlayer.name);
  }

  for (const localGame of data.games) {
    for (const localGamePlayer of localGame.players) {
      if (!players.has(localGamePlayer.id)) players.set(localGamePlayer.id, localGamePlayer.name);
    }
  }

  return [...players.entries()].map(([id, name]) => ({ id, name }) as const);
};

export const getGameParticipantIds = (data: LocalExportFileType, gameIds: string[]) => {
  const selectedGameIds = new Set(gameIds);

  return new Set(
    data.games
      .filter((localGame) => selectedGameIds.has(localGame.id))
      .flatMap((localGame) => localGame.players.map((localGamePlayer) => localGamePlayer.id))
  );
};

export const filterLocalData = (
  data: LocalExportFileType,
  selection: LocalDataSelection
): LocalExportFileType => {
  const gameIds = new Set(selection.gameIds);
  const quizSetNames = new Set(selection.quizSetNames);
  const playerIds = new Set([
    ...selection.playerIds,
    ...getGameParticipantIds(data, selection.gameIds),
  ]);

  return {
    meta: data.meta,
    games: data.games.filter((localGame) => gameIds.has(localGame.id)),
    players: data.players.filter((localPlayer) => playerIds.has(localPlayer.id)),
    quizes: data.quizes.filter((quiz) => quizSetNames.has(getQuizSetName(quiz))),
    logs: data.logs.filter((log) => gameIds.has(log.game_id)),
  } as const;
};

export const countNewResources = (data: LocalExportFileType, matchedPlayerIds: string[]) => {
  const matched = new Set(matchedPlayerIds);
  const newPlayerNames = new Set(
    listLocalPlayers(data)
      .filter((localPlayer) => !matched.has(localPlayer.id))
      .map((localPlayer) => localPlayer.name)
  );

  return {
    game: data.games.length,
    player: newPlayerNames.size,
    quiz: data.quizes.length,
  } as const;
};

export const findMatchedPlayerIds = (
  data: LocalExportFileType,
  existingPlayers: { id: string; name: string }[]
) => {
  const existingIds = new Set(existingPlayers.map((existingPlayer) => existingPlayer.id));
  const existingNames = new Set(existingPlayers.map((existingPlayer) => existingPlayer.name));

  return listLocalPlayers(data)
    .filter((localPlayer) => existingIds.has(localPlayer.id) || existingNames.has(localPlayer.name))
    .map((localPlayer) => localPlayer.id);
};
