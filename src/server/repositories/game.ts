import { and, asc, countDistinct, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { DBClient } from "@/utils/drizzle/client";
import { game, gameLog, gamePlayer, player } from "@/utils/drizzle/schema";

import { parseGameOption, setupDefaultGameOption } from "../utils/options";

import type {
  AddGameLogRequestType,
  AddPlayerToGameRequestType,
  CreateGameRequestType,
  ImportGameRequestType,
  UpdateGamePlayerRequestJsonType,
  UpdateGamePlayerType,
  UpdateGameRequestJsonType,
  UpdateGameSettingsRequestType,
} from "@/models/game";

/** 特定のゲーム情報を取得 */
export const getGameById = async (gameId: string, userId: string) => {
  const queryResult = await DBClient.query.game.findFirst({
    where: and(eq(game.id, gameId), eq(game.userId, userId), isNull(game.deletedAt)),
    with: {
      gameLog: {
        where: isNull(gameLog.deletedAt),
      },
      gamePlayer: {
        where: isNull(gamePlayer.deletedAt),
        with: {
          player: {
            columns: {
              id: true,
              name: true,
              description: true,
              affiliation: true,
            },
          },
        },
        columns: {
          displayOrder: true,
          initialScore: true,
          initialCorrectCount: true,
          initialWrongCount: true,
          baseCorrectPoint: true,
        },
      },
    },
  });

  if (!queryResult || !queryResult.id) {
    return null;
  }

  const { gameLog: gameLogData, gamePlayer: gamePlayerData, ...gameData } = queryResult;

  // ゲーム設定を取得
  const parsedGame = parseGameOption(gameData);

  if (!parsedGame) {
    return null;
  }

  return {
    ...parsedGame,
    players: gamePlayerData.map((p) => ({
      id: p.player?.id || "",
      name: p.player?.name || "",
      description: p.player?.description || "",
      affiliation: p.player?.affiliation || "",
      displayOrder: p.displayOrder,
      initialScore: p.initialScore,
      initialCorrectCount: p.initialCorrectCount,
      initialWrongCount: p.initialWrongCount,
      baseCorrectPoint: p.baseCorrectPoint,
    })),
    logs: gameLogData,
  };
};

/** ユーザーのゲーム一覧を取得 */
export const getGames = async (userId: string) => {
  const games = await DBClient.select({
    id: game.id,
    name: game.name,
    ruleType: game.ruleType,
    updatedAt: game.updatedAt,
    isPublic: game.isPublic,
    // ログとプレイヤーを同時にJOINすると件数が掛け合わされるため、重複を除いて数える
    logCount: countDistinct(gameLog.id),
    playerCount: countDistinct(gamePlayer.id),
  })
    .from(game)
    .leftJoin(gameLog, and(eq(game.id, gameLog.gameId), isNull(gameLog.deletedAt)))
    .leftJoin(gamePlayer, and(eq(game.id, gamePlayer.gameId), isNull(gamePlayer.deletedAt)))
    .where(and(eq(game.userId, userId), isNull(game.deletedAt)))
    .groupBy(game.id)
    .orderBy(desc(game.updatedAt));

  return games.filter((g) => g.id !== null);
};

/** ゲーム作成 */
export const createGame = async (
  gamesData: CreateGameRequestType,
  userId: string
): Promise<{ ids: string[]; createdCount: number }> => {
  const gamesToInsert = gamesData.map((gameData) => ({
    id: nanoid(),
    name: gameData.name,
    ruleType: gameData.ruleType,
    discordWebhookUrl: gameData.discordWebhookUrl,
    option: setupDefaultGameOption(gameData),
    userId,
  }));

  await DBClient.insert(game).values(gamesToInsert);

  return {
    ids: gamesToInsert.map((g) => g.id),
    createdCount: gamesToInsert.length,
  };
};

/** ゲーム更新 */
export const updateGameByKey = async (
  updateData: {
    gameId: string;
  } & UpdateGameRequestJsonType,
  userId: string
) => {
  // keyがnameかdiscordWebhookUrlかそれ以外かで分岐
  const { gameId, key, value } = updateData;
  if (key === "quiz") {
    const result = await DBClient.update(game)
      .set({
        // 空文字が指定された場合は紐づけを解除する
        quizSetName: value.setName === "" ? null : value.setName,
        quizOffset: value.offset,
        updatedAt: new Date(),
      })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));
    return result.rowsAffected > 0;
  }
  if (key === "name" || key === "discordWebhookUrl") {
    const result = await DBClient.update(game)
      .set({
        [key]: value,
        updatedAt: new Date(),
      })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));
    return result.rowsAffected > 0;
  } else if (key === "option") {
    // TODO: valueが正しいスキーマであるかZodでバリデーション
    const result = await DBClient.update(game)
      .set({ option: value })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));
    return result.rowsAffected > 0;
  } else if (key === "isPublic") {
    const result = await DBClient.update(game)
      .set({
        isPublic: value,
        updatedAt: new Date(),
      })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));
    return result.rowsAffected > 0;
  } else if (key === "editable") {
    const result = await DBClient.update(game)
      .set({
        editable: value,
        updatedAt: new Date(),
      })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));
    return result.rowsAffected > 0;
  }
  return false;
};

/** ゲーム削除 */
export const deleteGameById = async (gameId: string, userId: string) => {
  const result = await DBClient.update(game)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(game.id, gameId), eq(game.userId, userId)));

  return result.rowsAffected > 0;
};

/** クラウドゲームプレイヤー取得 */
export const getGamePlayers = async (gameId: string, userId: string) => {
  const players = await DBClient.select({
    id: gamePlayer.id,
    gameId: gamePlayer.gameId,
    playerId: gamePlayer.playerId,
    displayOrder: gamePlayer.displayOrder,
    initialScore: gamePlayer.initialScore,
    initialCorrectCount: gamePlayer.initialCorrectCount,
    initialWrongCount: gamePlayer.initialWrongCount,
    baseCorrectPoint: gamePlayer.baseCorrectPoint,
    playerName: player.name,
    playerDisplayName: player.displayName,
  })
    .from(gamePlayer)
    .leftJoin(player, eq(gamePlayer.playerId, player.id))
    .where(
      and(
        eq(gamePlayer.gameId, gameId),
        eq(gamePlayer.userId, userId),
        isNull(gamePlayer.deletedAt)
      )
    )
    .orderBy(asc(gamePlayer.displayOrder));

  return players.map((p) => ({
    id: p.playerId || "",
    name: p.playerDisplayName || p.playerName || "",
    initial_correct: p.initialCorrectCount || 0,
    initial_wrong: p.initialWrongCount || 0,
    base_correct_point: p.baseCorrectPoint,
    base_wrong_point: 1,
  }));
};

/** ゲームプレイヤー追加 */
export const addGamePlayer = async (
  gameId: string,
  playerData: AddPlayerToGameRequestType,
  userId: string
) => {
  const result = await DBClient.insert(gamePlayer).values({
    ...playerData,
    gameId,
    userId,
  });
  return result.rowsAffected > 0;
};

/** ゲームログ取得 */
export const getGameLogsById = async (gameId: string, userId: string) => {
  const logs = await DBClient.select()
    .from(gameLog)
    .where(and(eq(gameLog.gameId, gameId), eq(gameLog.userId, userId), isNull(gameLog.deletedAt)))
    .orderBy(asc(gameLog.timestamp));

  return logs;
};

/** クラウドゲームログ追加 */
export const addGameLog = async (logData: AddGameLogRequestType, userId: string) => {
  const logId = nanoid();

  await DBClient.insert(gameLog).values({
    id: logId,
    gameId: logData.gameId,
    playerId: logData.playerId,
    questionNumber: logData.questionNumber,
    actionType: logData.actionType,
    scoreChange: logData.scoreChange || 0,
    isSystemAction: logData.isSystemAction || false,
    panel: logData.panel,
    removedPanel: logData.removedPanel,
    userId,
  });

  return logId;
};

/** ゲームログ情報を取得 */
export const getGameLogById = async (logId: string, userId: string) => {
  const log = await DBClient.select({
    id: gameLog.id,
    gameId: gameLog.gameId,
  })
    .from(gameLog)
    .where(and(eq(gameLog.id, logId), eq(gameLog.userId, userId)))
    .limit(1);

  return log[0] || null;
};

/** クラウドゲームログ削除（元に戻す用） */
export const removeGameLog = async (logId: string, userId: string) => {
  await DBClient.delete(gameLog).where(and(eq(gameLog.id, logId), eq(gameLog.userId, userId)));
};

/** ゲームのログをすべて削除する（ゲームのリセット用） */
export const removeAllGameLogs = async (gameId: string, userId: string) => {
  const result = await DBClient.delete(gameLog).where(
    and(eq(gameLog.gameId, gameId), eq(gameLog.userId, userId))
  );

  return { deletedCount: result.rowsAffected };
};

/** ゲームの名前かDiscord Webhook URLを更新 */
export const updateGameSettings = async (
  gameId: string,
  settingsData: UpdateGameSettingsRequestType,
  userId: string
): Promise<boolean> => {
  try {
    const gameData = await getGameById(gameId, userId);
    if (!gameData) return false;

    await DBClient.update(game)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(and(eq(game.id, gameId), eq(game.userId, userId)));

    return true;
  } catch (error) {
    console.error("Failed to update game settings:", error);
    return false;
  }
};

/** ゲームプレイヤー一括更新 */
export const updateGamePlayers = async (
  gameId: string,
  players: UpdateGamePlayerType[],
  userId: string
): Promise<{ updatedCount: number }> => {
  let updatedCount = 0;

  try {
    // 既存のプレイヤーを論理削除
    await DBClient.update(gamePlayer)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamePlayer.gameId, gameId),
          eq(gamePlayer.userId, userId),
          isNull(gamePlayer.deletedAt)
        )
      );

    // 新しいプレイヤーリストを挿入
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      await DBClient.insert(gamePlayer).values({
        gameId,
        playerId: player.id,
        displayOrder: i,
        initialScore: player.initialScore || 0,
        initialCorrectCount: player.initialCorrectCount || 0,
        initialWrongCount: player.initialWrongCount || 0,
        baseCorrectPoint: player.baseCorrectPoint,
        userId,
      });
      updatedCount++;
    }

    return { updatedCount };
  } catch (error) {
    console.error("Error in updateGamePlayers:", error);
    throw error;
  }
};

/** 既存ゲームからプレイヤーをコピー */
export const copyPlayersFromGame = async (
  targetGameId: string,
  sourceGameId: string,
  userId: string
): Promise<{ copiedCount: number }> => {
  // ソースゲームのプレイヤーを取得
  const sourcePlayers = await DBClient.select({
    playerId: gamePlayer.playerId,
    displayOrder: gamePlayer.displayOrder,
    initialScore: gamePlayer.initialScore,
    initialCorrectCount: gamePlayer.initialCorrectCount,
    initialWrongCount: gamePlayer.initialWrongCount,
    baseCorrectPoint: gamePlayer.baseCorrectPoint,
  })
    .from(gamePlayer)
    .where(
      and(
        eq(gamePlayer.gameId, sourceGameId),
        eq(gamePlayer.userId, userId),
        isNull(gamePlayer.deletedAt)
      )
    )
    .orderBy(asc(gamePlayer.displayOrder));

  if (sourcePlayers.length === 0) {
    return { copiedCount: 0 };
  }

  // 既存のプレイヤーを論理削除
  await DBClient.update(gamePlayer)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(gamePlayer.gameId, targetGameId),
        eq(gamePlayer.userId, userId),
        isNull(gamePlayer.deletedAt)
      )
    );

  // コピーしたプレイヤーを挿入
  let copiedCount = 0;
  for (const player of sourcePlayers) {
    if (player.playerId) {
      await DBClient.insert(gamePlayer).values({
        gameId: targetGameId,
        playerId: player.playerId,
        displayOrder: player.displayOrder || copiedCount,
        initialScore: player.initialScore || 0,
        initialCorrectCount: player.initialCorrectCount || 0,
        initialWrongCount: player.initialWrongCount || 0,
        baseCorrectPoint: player.baseCorrectPoint,
        userId,
      });
      copiedCount++;
    }
  }

  return { copiedCount };
};

/** ゲームオプション取得 */
export const getGameOptionById = async (gameId: string, userId: string) => {
  const gameData = await DBClient.query.game.findFirst({
    where: and(eq(game.id, gameId), eq(game.userId, userId)),
    columns: {
      ruleType: true,
      option: true,
    },
  });
  if (!gameData) {
    return null;
  }
  const parsedOption = setupDefaultGameOption(gameData);
  return parsedOption;
};

/** ゲームオプション更新 */
export const updateGameOption = async (
  gameId: string,
  option: {
    [key: string]: string | number | boolean;
  },
  userId: string
) => {
  const result = await DBClient.update(game)
    .set({
      option,
      updatedAt: new Date(),
    })
    .where(and(eq(game.id, gameId), eq(game.userId, userId), isNull(game.deletedAt)));

  return result.rowsAffected > 0;
};

/** ゲームプレイヤー個別更新 */
export const updateGamePlayerByKey = async (
  gamePlayerId: string,
  updateData: UpdateGamePlayerRequestJsonType,
  userId: string
): Promise<boolean> => {
  try {
    const { key, value } = updateData;

    const result = await DBClient.update(gamePlayer)
      .set({
        [key]: value,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamePlayer.id, gamePlayerId),
          eq(gamePlayer.userId, userId),
          isNull(gamePlayer.deletedAt)
        )
      );

    return result.rowsAffected > 0;
  } catch (error) {
    console.error("Failed to update game player:", error);
    return false;
  }
};

/** ゲームプレイヤー削除（指定されたプレイヤーIDのリストを削除） */
export const removeGamePlayers = async (
  gameId: string,
  playerIds: string[],
  userId: string
): Promise<{ deletedCount: number }> => {
  try {
    let deletedCount = 0;

    for (const playerId of playerIds) {
      const result = await DBClient.update(gamePlayer)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(gamePlayer.gameId, gameId),
            eq(gamePlayer.playerId, playerId),
            eq(gamePlayer.userId, userId),
            isNull(gamePlayer.deletedAt)
          )
        );

      if (result.rowsAffected > 0) {
        deletedCount++;
      }
    }

    return { deletedCount };
  } catch (error) {
    console.error("Failed to remove game players:", error);
    throw error;
  }
};

/** 公開ゲーム情報を取得（認証不要） */
export const getPublicGameById = async (gameId: string) => {
  const queryResult = await DBClient.query.game.findFirst({
    where: and(eq(game.id, gameId), eq(game.isPublic, true), isNull(game.deletedAt)),
    with: {
      gameLog: {
        where: isNull(gameLog.deletedAt),
      },
      gamePlayer: {
        where: isNull(gamePlayer.deletedAt),
        with: {
          player: {
            columns: {
              id: true,
              name: true,
              description: true,
              affiliation: true,
            },
          },
        },
        columns: {
          displayOrder: true,
          initialScore: true,
          initialCorrectCount: true,
          initialWrongCount: true,
          baseCorrectPoint: true,
        },
      },
    },
  });

  if (!queryResult || !queryResult.id) {
    return null;
  }

  const { gameLog: gameLogData, gamePlayer: gamePlayerData, ...gameData } = queryResult;

  // ゲーム設定を取得
  const parsedGame = parseGameOption(gameData);

  if (!parsedGame) {
    return null;
  }

  return {
    ...parsedGame,
    players: gamePlayerData.map((p) => ({
      id: p.player?.id || "",
      name: p.player?.name || "",
      description: p.player?.description || "",
      affiliation: p.player?.affiliation || "",
      displayOrder: p.displayOrder,
      initialScore: p.initialScore,
      initialCorrectCount: p.initialCorrectCount,
      initialWrongCount: p.initialWrongCount,
      baseCorrectPoint: p.baseCorrectPoint,
    })),
    logs: gameLogData,
  };
};

/**
 * エクスポートしたゲームデータからゲームを復元する
 *
 * プレイヤーは同じIDのものがあれば再利用し、無ければ同名のプレイヤーを探して紐づけます。 どちらも見つからない場合は新しいプレイヤーとして作成します。
 *
 * @param importData エクスポートされたゲームデータ
 * @param userId 復元先のユーザーID
 * @returns 作成したゲームのID
 */
export const importGame = async (importData: ImportGameRequestType, userId: string) => {
  const { data } = importData;

  const gameId = nanoid();
  await DBClient.insert(game).values({
    id: gameId,
    name: data.name,
    ruleType: data.ruleType,
    discordWebhookUrl: data.discordWebhookUrl ?? null,
    option: setupDefaultGameOption({
      ruleType: data.ruleType,
      option: data.option,
    }),
    quizSetName: data.quizSetName ?? null,
    quizOffset: data.quizOffset ?? 0,
    userId,
  });

  // このユーザーが持つ既存のプレイヤーを一度だけ読み込み、IDと名前の両方から引けるようにする
  const existingPlayers = await DBClient.select({ id: player.id, name: player.name })
    .from(player)
    .where(and(eq(player.userId, userId), isNull(player.deletedAt)));

  const playerIdSet = new Set(existingPlayers.map((p) => p.id));
  const playerIdByName = new Map(existingPlayers.map((p) => [p.name, p.id]));

  // インポート元のプレイヤーIDを、このユーザーが持つプレイヤーIDへ対応付ける
  const playerIdMap = new Map<string, string>();
  const playersToCreate: (typeof player.$inferInsert)[] = [];

  for (const importedPlayer of data.players) {
    let playerId = playerIdSet.has(importedPlayer.id)
      ? importedPlayer.id
      : playerIdByName.get(importedPlayer.name);

    if (!playerId) {
      playerId = nanoid();
      playersToCreate.push({
        id: playerId,
        name: importedPlayer.name,
        displayName: importedPlayer.name,
        affiliation: importedPlayer.affiliation ?? null,
        description: importedPlayer.description ?? null,
        userId,
      });
      // 同じ名前が複数回現れた場合に重複して作らないようにする
      playerIdByName.set(importedPlayer.name, playerId);
    }

    playerIdMap.set(importedPlayer.id, playerId);
  }

  if (playersToCreate.length > 0) {
    await DBClient.insert(player).values(playersToCreate);
  }

  const gamePlayersToCreate = data.players.map((importedPlayer) => ({
    gameId,
    playerId: playerIdMap.get(importedPlayer.id),
    displayOrder: importedPlayer.displayOrder,
    initialScore: importedPlayer.initialScore ?? 0,
    initialCorrectCount: importedPlayer.initialCorrectCount ?? 0,
    initialWrongCount: importedPlayer.initialWrongCount ?? 0,
    baseCorrectPoint: importedPlayer.baseCorrectPoint ?? 1,
    userId,
  }));

  if (gamePlayersToCreate.length > 0) {
    await DBClient.insert(gamePlayer).values(gamePlayersToCreate);
  }

  const logsToCreate = data.logs.map((importedLog) => ({
    id: nanoid(),
    gameId,
    // スルーやスキップのようにプレイヤーが紐づかないログもそのまま復元する
    playerId: importedLog.playerId ? (playerIdMap.get(importedLog.playerId) ?? null) : null,
    questionNumber: importedLog.questionNumber ?? null,
    actionType: importedLog.actionType,
    scoreChange: importedLog.scoreChange ?? 0,
    panel: importedLog.panel ?? null,
    removedPanel: importedLog.removedPanel ?? null,
    timestamp: importedLog.timestamp ? new Date(importedLog.timestamp) : new Date(),
    isSystemAction: importedLog.isSystemAction ?? false,
    userId,
  }));

  if (logsToCreate.length > 0) {
    await DBClient.insert(gameLog).values(logsToCreate);
  }

  return { gameId, playerCount: data.players.length, logCount: data.logs.length };
};

/**
 * ゲームログの解答者を更新する
 *
 * エンドレスチャンスのように、1つの問題に対して複数のプレイヤーの誤答をまとめて記録する形式で 使用します。
 *
 * @param logId 更新するログのID
 * @param playerId 記録する解答者のID（カンマ区切りで複数指定できます）
 * @param userId 操作するユーザーのID
 * @returns 更新できたかどうか
 */
export const updateGameLogPlayers = async (logId: string, playerId: string, userId: string) => {
  const result = await DBClient.update(gameLog)
    .set({ playerId, timestamp: new Date() })
    .where(and(eq(gameLog.id, logId), eq(gameLog.userId, userId)));

  return result.rowsAffected > 0;
};
