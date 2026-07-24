import { cacheBoardData } from "@/utils/cache/cache-service";
import { computeOnlineScore } from "@/utils/online/computeScore/computeOnlineScore";

import type {
  GetGameDetailResponseType,
  GetViewerBoardDataResponseType,
  Variants,
} from "@/models/game";
import type { getGameById } from "@/server/repositories/game";

/** リポジトリから取得したゲームデータ（プレイヤー・ログを含む） */
export type GameWithRelations = NonNullable<Awaited<ReturnType<typeof getGameById>>>;

/**
 * リポジトリのゲームデータをスコア計算が扱える形式へ変換する
 *
 * リポジトリはDate型で日付を返すのに対し、スコア計算はAPIレスポンスと同じ文字列形式を前提と しているため、日付フィールドをISO文字列へ揃えます。
 *
 * @param gameData リポジトリから取得したゲームデータ
 * @returns スコア計算に渡せる形式のゲームデータ
 */
export const serializeGameForCompute = (gameData: GameWithRelations) => {
  const players = gameData.players.map((player) => ({
    id: player.id,
    name: player.name,
    description: player.description,
    affiliation: player.affiliation,
    displayOrder: player.displayOrder,
    initialScore: player.initialScore,
    initialCorrectCount: player.initialCorrectCount,
    initialWrongCount: player.initialWrongCount,
    baseCorrectPoint: player.baseCorrectPoint,
  }));

  const logs = gameData.logs.map((log) => ({
    ...log,
    timestamp: log.timestamp?.toISOString() || "",
    deletedAt: log.deletedAt?.toISOString() || null,
  }));

  const game = {
    ...gameData,
    createdAt: gameData.createdAt?.toISOString() || "",
    updatedAt: gameData.updatedAt?.toISOString() || "",
    deletedAt: gameData.deletedAt?.toISOString() || null,
    players,
    logs,
  } satisfies GetGameDetailResponseType;

  return { game, players, logs } as const;
};

/**
 * 観戦モード向けのボードデータを組み立てる
 *
 * スコア計算を実行し、観戦ページがそのまま描画できる形へ整形します。
 *
 * @param gameData リポジトリから取得したゲームデータ
 * @returns 観戦モード用のボードデータ
 */
export const buildBoardData = (gameData: GameWithRelations): GetViewerBoardDataResponseType => {
  const { game, players, logs } = serializeGameForCompute(gameData);
  const { scores } = computeOnlineScore(game, players, logs);

  return {
    game: {
      id: gameData.id,
      name: gameData.name,
      ruleType: gameData.ruleType,
      isPublic: gameData.isPublic,
      createdAt: gameData.createdAt?.toISOString(),
      updatedAt: gameData.updatedAt?.toISOString(),
    },
    players: scores,
    logs: gameData.logs.map((log) => ({
      id: log.id,
      player_id: log.playerId || "",
      variant: log.actionType satisfies Variants,
      system: log.isSystemAction ? 1 : 0,
      available: 1,
      createdAt: log.timestamp?.toISOString(),
      updatedAt: log.timestamp?.toISOString(),
    })),
  };
};

/**
 * 公開ゲームのボードキャッシュを最新の状態へ更新する
 *
 * 非公開ゲームの場合は何もしません。キャッシュ更新の失敗はゲーム進行を妨げないよう、 ログ出力のみ行って握りつぶします。
 *
 * @param gameData リポジトリから取得したゲームデータ
 */
export const refreshBoardCache = async (gameData: GameWithRelations | null): Promise<void> => {
  if (!gameData || !gameData.isPublic) {
    return;
  }

  try {
    await cacheBoardData(gameData.id, buildBoardData(gameData));
  } catch (error) {
    console.error(`Failed to update board cache for game ${gameData.id}:`, error);
  }
};
