import { describe, expect, it } from "vitest";

import {
  applyReversiFlip,
  computeAttack25Board,
  countPanels,
  FIRST_PANEL_INDEX,
  getClaimablePanels,
  PANEL_COUNT,
} from "@/utils/online/attack25";

import computeAttack25 from "../attack25";
import { getInitialPlayersStateForOnline } from "../index";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type Attack25Game = Extract<GetGameDetailResponseType, { ruleType: "attack25" }>;

/**
 * アタック25形式のゲームデータを生成する。
 *
 * @param players ゲームに参加するプレイヤー一覧
 * @param logs 適用するゲームログ
 * @param attackChance アタックチャンスを有効にするか
 * @returns アタック25形式のゲーム設定
 */
const createAttack25Game = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  attackChance = true
): Attack25Game => ({
  id: "game-attack25",
  name: "attack25",
  ruleType: "attack25" as const,
  option: {
    attack_chance: attackChance,
    limit: undefined,
    win_through: undefined,
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
  discordWebhookUrl: null,
  quizSetName: null,
  quizOffset: 0,
  editable: false,
  isPublic: false,
  userId: "user-1",
  players,
  logs,
});

/**
 * プレイヤーを生成する。
 *
 * @param id プレイヤーID
 * @param displayOrder 表示順
 * @returns プレイヤー設定
 */
const createPlayer = (id: string, displayOrder: number): GamePlayerProps => ({
  id,
  name: id,
  description: "",
  affiliation: "",
  displayOrder,
  initialScore: 0,
  initialCorrectCount: 0,
  initialWrongCount: 0,
  baseCorrectPoint: 1,
});

/**
 * アタック25の正解ログを生成する。
 *
 * @param playerId プレイヤーID
 * @param panel 獲得したパネル番号
 * @param removedPanel 消去したパネル番号（アタックチャンス）
 * @returns ゲームログ
 */
const createCorrectLog = (
  playerId: string,
  panel: number,
  removedPanel: number | null = null
): SeriarizedGameLog => ({
  id: `log-${playerId}-${panel}`,
  gameId: "game-attack25",
  playerId,
  questionNumber: panel,
  actionType: "correct",
  scoreChange: 0,
  timestamp: "2024-01-01T00:00:00.000Z",
  isSystemAction: false,
  panel,
  removedPanel,
  deletedAt: null,
  userId: "user-1",
});

describe("attack25 オセロ盤面ロジック", () => {
  it("初手は必ず中央パネル(13番=index12)のみ獲得できる", () => {
    const emptyBoard = Array.from({ length: PANEL_COUNT }, () => null);
    expect(getClaimablePanels(emptyBoard, "p1")).toEqual([FIRST_PANEL_INDEX]);
  });

  it("挟んだ相手パネルがオセロ形式で反転する", () => {
    // 0 1 2 の一列で p1(0) と p1(2) が p2(1) を挟む
    let board: (string | null)[] = Array.from({ length: PANEL_COUNT }, () => null);
    board = applyReversiFlip(board, 0, "p1");
    board = applyReversiFlip(board, 1, "p2");
    board = applyReversiFlip(board, 2, "p1");
    expect(board[1]).toBe("p1");
    expect(countPanels(board)).toEqual({ p1: 3 });
  });

  it("パネル情報の無い正解ログや埋まったパネルへのログは無視される", () => {
    const logs: SeriarizedGameLog[] = [
      createCorrectLog("p1", 12),
      // 同じパネルへの重複ログは無視される
      createCorrectLog("p2", 12),
    ];
    const { board } = computeAttack25Board(logs, true);
    expect(board[12]).toBe("p1");
    expect(countPanels(board)).toEqual({ p1: 1 });
  });
});

describe("online attack25形式", () => {
  it("保持パネル数がスコアになり、盤面が埋まるまでは全員playing", () => {
    const players = [
      createPlayer("p1", 0),
      createPlayer("p2", 1),
      createPlayer("p3", 2),
      createPlayer("p4", 3),
    ];
    const logs = [createCorrectLog("p1", 12), createCorrectLog("p2", 7)];
    const game = createAttack25Game(players, logs);
    const initial = getInitialPlayersStateForOnline(game);

    const { scores } = computeAttack25(game, initial, logs);

    const p1 = scores.find((s) => s.player_id === "p1");
    const p2 = scores.find((s) => s.player_id === "p2");
    expect(p1?.score).toBe(1);
    expect(p2?.score).toBe(1);
    expect(scores.every((s) => s.state === "playing")).toBe(true);
    expect(p1?.text).toBe("1枚");
  });

  it("盤面が埋まると最多保持者が優勝(win)となり、他は敗退する", () => {
    const players = [
      createPlayer("p1", 0),
      createPlayer("p2", 1),
      createPlayer("p3", 2),
      createPlayer("p4", 3),
    ];
    // 全25パネルを p1 が獲得して盤面を埋める
    const logs = Array.from({ length: PANEL_COUNT }, (_, i) => createCorrectLog("p1", i));
    const game = createAttack25Game(players, logs);
    const initial = getInitialPlayersStateForOnline(game);

    const { scores, winPlayers } = computeAttack25(game, initial, logs);

    const p1 = scores.find((s) => s.player_id === "p1");
    expect(p1?.score).toBe(PANEL_COUNT);
    expect(p1?.state).toBe("win");
    expect(p1?.order).toBe(0);
    expect(scores.filter((s) => s.state === "lose")).toHaveLength(3);
    // 盤面がちょうど埋まったログで勝者が通知される
    expect(winPlayers).toEqual([{ player_id: "p1", text: p1?.text }]);
  });

  it("アタックチャンスで相手パネルを消去できる", () => {
    // 盤面の空きを5枚以下にしてからアタックチャンスの消去を行う
    const fillLogs = Array.from({ length: 20 }, (_, i) => createCorrectLog("p1", i));
    // 残り5枚(index20-24)。p2が21番を獲得しつつ、アタックチャンスで20番のp1パネルを消す
    const attackLog = createCorrectLog("p2", 21, 20);
    const logs = [...fillLogs, attackLog];
    const { board } = computeAttack25Board(logs, true);

    expect(board[21]).toBe("p2");
    // 20番は消去されて空きに戻る
    expect(board[20]).toBe(null);
  });
});
