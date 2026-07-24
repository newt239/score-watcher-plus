import { describe, expect, it } from "vitest";

import { getInitialPlayersStateForOnline } from "../index";
import computeZ from "../z";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type ZGame = Extract<GetGameDetailResponseType, { ruleType: "z" }>;

/** Z形式のゲームデータを生成する。 */
const createZGame = (players: GamePlayerProps[], logs: SeriarizedGameLog[]): ZGame => ({
  id: "game-z",
  name: "z",
  ruleType: "z" as const,
  option: {},
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

/** ゲーム参加者を生成する。 */
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

/** ゲームログを生成する。 */
const createLog = (
  playerId: string,
  actionType: SeriarizedGameLog["actionType"],
  index: number
): SeriarizedGameLog => ({
  id: `log-${index}`,
  gameId: "game-z",
  playerId,
  questionNumber: index,
  actionType,
  scoreChange: 0,
  timestamp: `2024-01-01T00:00:00.00${index}Z`,
  isSystemAction: false,
  deletedAt: null,
  userId: "user-1",
});

describe("online z形式", () => {
  it("ステージ1は1回の正解でクリアしステージ2へ進む", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [createLog("player-1", "correct", 0)];
    const game = createZGame(players, logs);

    const result = computeZ(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ stage: 2, correct: 0, text: "Stage2" });
  });

  it("ステージ1で誤答すると1問だけ休みになる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [createLog("player-1", "wrong", 0)];
    const game = createZGame(players, logs);

    const result = computeZ(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ stage: 1, wrong: 0, text: "休" });
  });

  it("誰かがステージをクリアすると他のプレイヤーの正誤がリセットされる", () => {
    const players = [createPlayer("player-1", 0), createPlayer("player-2", 1)];
    const logs = [
      // player-2 がステージ2で1回正解した状態を作る
      createLog("player-2", "correct", 0),
      createLog("player-2", "correct", 1),
      // player-1 がステージ1をクリアする
      createLog("player-1", "correct", 2),
    ];
    const game = createZGame(players, logs);

    const result = computeZ(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores.find((s) => s.player_id === "player-2")).toMatchObject({
      stage: 2,
      correct: 0,
      wrong: 0,
    });
  });

  it("ステージ4を4回の正解でクリアすると勝ち抜けになる", () => {
    const players = [createPlayer("player-1", 0)];
    // ステージ1(1回)、ステージ2(2回)、ステージ3(3回)、ステージ4(4回)
    const correctCounts = [1, 2, 3, 4];
    const logs = correctCounts
      .flatMap((count) => Array.from({ length: count }, () => "correct" as const))
      .map((actionType, index) => createLog("player-1", actionType, index));
    const game = createZGame(players, logs);

    const result = computeZ(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ state: "win", text: "1st" });
    expect(result.winPlayers).toHaveLength(1);
  });

  it("ステージ2で誤答すると失格になる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [
      // ステージ1をクリアしてステージ2へ
      createLog("player-1", "correct", 0),
      createLog("player-1", "wrong", 1),
    ];
    const game = createZGame(players, logs);

    const result = computeZ(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ state: "lose", is_incapacity: true, text: "休" });
  });
});
