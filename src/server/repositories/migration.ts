import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { chunk } from "@/server/utils/migration/chunk";
import { toGameOption } from "@/server/utils/migration/to-game-option";
import { DBClient } from "@/utils/drizzle/client";
import {
  game,
  gameLog,
  gamePlayer,
  player,
  playerPlayerTag,
  playerTag,
  quizQuestion,
  quizSet,
} from "@/utils/drizzle/schema";

import type { ImportLocalDataRequestType } from "@/models/migration";

const INSERT_CHUNK_SIZE = 100;

/** ローカル版でセット名が空のまま保存された問題をまとめる先 */
const FALLBACK_QUIZ_SET_NAME = "インポート";

const toDate = (value: string | null | undefined) => {
  if (!value) return new Date();
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

/** ローカル版のログのplayer_idをPlusのプレイヤーIDへ変換する。エンドレスチャンスはカンマ区切りで複数持つ */
const toLogPlayerId = (localPlayerId: string, playerIdMap: Map<string, string>) => {
  const resolved = localPlayerId.split(",").flatMap((localId) => {
    const playerId = playerIdMap.get(localId.trim());

    return playerId ? [playerId] : [];
  });

  return resolved.length > 0 ? resolved.join(",") : null;
};

/**
 * ローカル版のデータをPlusの各テーブルへ流し込める形に解決する
 *
 * DBへの書き込みは行わず、既存プレイヤー・タグ・クイズセットとの突き合わせだけを行います。
 * トランザクションが使えないため、プラン上限の判定を書き込み前に終わらせる目的で読み取りと書き込みを分けています。
 *
 * @param data ローカル版から書き出したJSON
 * @param userId 取り込み先のユーザーID
 * @returns 書き込む行と、プラン上限の判定に使う件数
 */
export const prepareLocalDataImport = async (data: ImportLocalDataRequestType, userId: string) => {
  const existingPlayers = await DBClient.select({ id: player.id, name: player.name })
    .from(player)
    .where(and(eq(player.userId, userId), isNull(player.deletedAt)));

  const playerIdSet = new Set(existingPlayers.map((p) => p.id));
  const playerIdByName = new Map(existingPlayers.map((p) => [p.name, p.id]));

  const playerIdMap = new Map<string, string>();
  const playersToCreate: (typeof player.$inferInsert)[] = [];
  const tagNamesByNewPlayerId = new Map<string, string[]>();

  const registerPlayer = (localPlayer: {
    id: string;
    name: string;
    displayName: string;
    affiliation: string | null;
    tags: string[];
  }) => {
    if (playerIdMap.has(localPlayer.id)) return;

    let playerId = playerIdSet.has(localPlayer.id)
      ? localPlayer.id
      : playerIdByName.get(localPlayer.name);

    if (!playerId) {
      playerId = nanoid();
      playersToCreate.push({
        id: playerId,
        name: localPlayer.name,
        displayName: localPlayer.displayName,
        affiliation: localPlayer.affiliation,
        description: null,
        userId,
      });
      // 同じ名前が複数回現れた場合に重複して作らないようにする
      playerIdByName.set(localPlayer.name, playerId);

      if (localPlayer.tags.length > 0) {
        tagNamesByNewPlayerId.set(playerId, localPlayer.tags);
      }
    }

    playerIdMap.set(localPlayer.id, playerId);
  };

  for (const localPlayer of data.players) {
    registerPlayer({
      id: localPlayer.id,
      name: localPlayer.name,
      displayName: localPlayer.text?.trim() ? localPlayer.text : localPlayer.name,
      affiliation: localPlayer.belong?.trim() ? localPlayer.belong : null,
      tags: localPlayer.tags ?? [],
    });
  }

  // プレイヤー一覧から消されたあともゲームには残っているプレイヤーを拾う
  for (const localGame of data.games) {
    for (const localGamePlayer of localGame.players) {
      registerPlayer({
        id: localGamePlayer.id,
        name: localGamePlayer.name,
        displayName: localGamePlayer.name,
        affiliation: null,
        tags: [],
      });
    }
  }

  const tagNames = [...new Set([...tagNamesByNewPlayerId.values()].flat())];
  const tagIdByName = new Map<string, string>();
  const tagsToCreate: (typeof playerTag.$inferInsert)[] = [];

  if (tagNames.length > 0) {
    const existingTags = await DBClient.select({ id: playerTag.id, tagName: playerTag.tagName })
      .from(playerTag)
      .where(and(eq(playerTag.userId, userId), isNull(playerTag.deletedAt)));

    for (const existingTag of existingTags) {
      tagIdByName.set(existingTag.tagName, existingTag.id);
    }

    for (const tagName of tagNames) {
      if (tagIdByName.has(tagName)) continue;

      const tagId = nanoid();
      tagsToCreate.push({ id: tagId, tagName, userId });
      tagIdByName.set(tagName, tagId);
    }
  }

  const playerTagLinksToCreate = [...tagNamesByNewPlayerId.entries()].flatMap(([playerId, names]) =>
    names.flatMap((tagName) => {
      const playerTagId = tagIdByName.get(tagName);

      return playerTagId ? [{ id: nanoid(), playerId, playerTagId }] : [];
    })
  );

  const quizesBySetName = new Map<string, ImportLocalDataRequestType["quizes"]>();

  for (const quiz of data.quizes) {
    const setName = quiz.set_name?.trim() ? quiz.set_name : FALLBACK_QUIZ_SET_NAME;
    const quizes = quizesBySetName.get(setName);

    if (quizes) {
      quizes.push(quiz);
    } else {
      quizesBySetName.set(setName, [quiz]);
    }
  }

  const existingQuizSets =
    quizesBySetName.size > 0
      ? await DBClient.select({
          id: quizSet.id,
          name: quizSet.name,
          totalQuestions: quizSet.totalQuestions,
        })
          .from(quizSet)
          .where(and(eq(quizSet.userId, userId), isNull(quizSet.deletedAt)))
      : [];

  const quizSetByName = new Map(existingQuizSets.map((set) => [set.name, set]));

  const quizSetsToCreate: (typeof quizSet.$inferInsert)[] = [];
  const quizSetsToUpdate: { id: string; totalQuestions: number }[] = [];
  const quizQuestionsToCreate: (typeof quizQuestion.$inferInsert)[] = [];

  for (const [setName, quizes] of quizesBySetName) {
    const existingSet = quizSetByName.get(setName);
    let quizSetId: string;

    if (existingSet) {
      quizSetId = existingSet.id;
      quizSetsToUpdate.push({
        id: existingSet.id,
        totalQuestions: existingSet.totalQuestions + quizes.length,
      });
    } else {
      quizSetId = nanoid();
      quizSetsToCreate.push({
        id: quizSetId,
        name: setName,
        totalQuestions: quizes.length,
        userId,
      });
    }

    for (const quiz of quizes) {
      quizQuestionsToCreate.push({
        id: nanoid(),
        quizSetId,
        questionNumber: quiz.n,
        questionText: quiz.q,
        answerText: quiz.a,
        category: null,
        difficultyLevel: null,
        userId,
      });
    }
  }

  const gameIdMap = new Map<string, string>();
  const gamesToCreate: (typeof game.$inferInsert)[] = [];
  const gamePlayersToCreate: (typeof gamePlayer.$inferInsert)[] = [];

  for (const localGame of data.games) {
    const gameId = nanoid();
    gameIdMap.set(localGame.id, gameId);

    const lastOpen = toDate(localGame.last_open);
    gamesToCreate.push({
      id: gameId,
      name: localGame.name,
      ruleType: localGame.rule,
      option: toGameOption(localGame),
      discordWebhookUrl: localGame.discord_webhook_url ?? null,
      quizSetName: localGame.quiz?.set_name ?? null,
      quizOffset: localGame.quiz?.offset ?? 0,
      editable: localGame.editable ?? false,
      isPublic: false,
      createdAt: lastOpen,
      updatedAt: lastOpen,
      userId,
    });

    localGame.players.forEach((localGamePlayer, index) => {
      gamePlayersToCreate.push({
        gameId,
        playerId: playerIdMap.get(localGamePlayer.id) ?? null,
        displayOrder: index,
        initialScore: 0,
        initialCorrectCount: localGamePlayer.initial_correct ?? 0,
        initialWrongCount: localGamePlayer.initial_wrong ?? 0,
        baseCorrectPoint: Math.max(1, localGamePlayer.base_correct_point ?? 1),
        userId,
      });
    });
  }

  const logsByGameId = new Map<
    string,
    { gameId: string; logs: ImportLocalDataRequestType["logs"] }
  >();

  for (const log of data.logs) {
    const gameId = gameIdMap.get(log.game_id);
    if (!gameId) continue;

    const entry = logsByGameId.get(log.game_id);

    if (entry) {
      entry.logs.push(log);
    } else {
      logsByGameId.set(log.game_id, { gameId, logs: [log] });
    }
  }

  const logsToCreate: (typeof gameLog.$inferInsert)[] = [];

  for (const { gameId, logs } of logsByGameId.values()) {
    const sortedLogs = logs
      .map((log, index) => ({ log, index, timestamp: toDate(log.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime() || a.index - b.index);

    sortedLogs.forEach(({ log, timestamp }, questionNumber) => {
      logsToCreate.push({
        id: nanoid(),
        gameId,
        playerId: toLogPlayerId(log.player_id, playerIdMap),
        questionNumber,
        actionType: log.variant,
        scoreChange: 0,
        panel: log.detail?.panel ?? null,
        removedPanel: log.detail?.removed_panel ?? null,
        timestamp,
        isSystemAction: log.system === 1,
        userId,
      });
    });
  }

  return {
    playersToCreate,
    tagsToCreate,
    playerTagLinksToCreate,
    quizSetsToCreate,
    quizSetsToUpdate,
    quizQuestionsToCreate,
    gamesToCreate,
    gamePlayersToCreate,
    logsToCreate,
    counts: {
      game: gamesToCreate.length,
      player: playersToCreate.length,
      quiz: quizQuestionsToCreate.length,
    },
  } as const;
};

/**
 * 解決済みのデータをDBへ書き込む
 *
 * LibSQLのHTTP接続ではトランザクションが使えないため、一括insertを逐次実行します。
 *
 * @param plan PrepareLocalDataImportの結果
 * @returns 取り込んだ件数
 */
export const commitLocalDataImport = async (
  plan: Awaited<ReturnType<typeof prepareLocalDataImport>>
) => {
  for (const rows of chunk(plan.playersToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(player).values(rows);
  }

  for (const rows of chunk(plan.tagsToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(playerTag).values(rows);
  }

  for (const rows of chunk(plan.playerTagLinksToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(playerPlayerTag).values(rows);
  }

  for (const rows of chunk(plan.quizSetsToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(quizSet).values(rows);
  }

  for (const set of plan.quizSetsToUpdate) {
    await DBClient.update(quizSet)
      .set({ totalQuestions: set.totalQuestions, updatedAt: new Date() })
      .where(eq(quizSet.id, set.id));
  }

  for (const rows of chunk(plan.quizQuestionsToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(quizQuestion).values(rows);
  }

  for (const rows of chunk(plan.gamesToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(game).values(rows);
  }

  for (const rows of chunk(plan.gamePlayersToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(gamePlayer).values(rows);
  }

  for (const rows of chunk(plan.logsToCreate, INSERT_CHUNK_SIZE)) {
    await DBClient.insert(gameLog).values(rows);
  }

  return {
    gameCount: plan.gamesToCreate.length,
    playerCount: plan.playersToCreate.length,
    quizCount: plan.quizQuestionsToCreate.length,
    logCount: plan.logsToCreate.length,
  } as const;
};
