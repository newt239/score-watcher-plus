import { describe, expect, it } from "vitest";

import { getInitialPlayersStateForOnline } from "../index";
import computeSwedish10 from "../swedish10";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type Swedish10Game = Extract<GetGameDetailResponseType, { ruleType: "swedish10" }>;

/** Swedish10形式のゲームデータを生成する。 */
const createSwedish10Game = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  option?: Partial<Swedish10Game["option"]>
): Swedish10Game => ({
  id: "game-swedish10",
  name: "swedish10",
  ruleType: "swedish10" as const,
  option: { win_point: 10, lose_point: 10, ...option },
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
  gameId: "game-swedish10",
  playerId,
  questionNumber: index,
  actionType,
  scoreChange: 0,
  timestamp: `2024-01-01T00:00:00.00${index}Z`,
  isSystemAction: false,
  panel: null,
  removedPanel: null,
  deletedAt: null,
  userId: "user-1",
});

describe("online swedish10形式", () => {
  it("正解数が0のときの誤答ダメージは1", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [createLog("player-1", "wrong", 0)];
    const game = createSwedish10Game(players, logs);

    const result = computeSwedish10(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ wrong: 1, score: 1 });
  });

  it("正解数に応じて誤答ダメージが増える", () => {
    const players = [createPlayer("player-1", 0)];
    // 3回正解した状態（正解数3〜5）での誤答は3ダメージ
    const logs = [
      createLog("player-1", "correct", 0),
      createLog("player-1", "correct", 1),
      createLog("player-1", "correct", 2),
      createLog("player-1", "wrong", 3),
    ];
    const game = createSwedish10Game(players, logs);

    const result = computeSwedish10(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ correct: 3, wrong: 3, text: "3pt" });
  });

  it("正解数が6以上のときの誤答ダメージは4", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [
      ...Array.from({ length: 6 }, (_, i) => createLog("player-1", "correct", i)),
      createLog("player-1", "wrong", 6),
    ];
    const game = createSwedish10Game(players, logs);

    const result = computeSwedish10(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ correct: 6, wrong: 4 });
  });

  it("誤答ポイントが失格ポイントに達すると敗退になる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = Array.from({ length: 3 }, (_, i) => createLog("player-1", "wrong", i));
    const game = createSwedish10Game(players, logs, { lose_point: 3 });

    const result = computeSwedish10(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ state: "lose", text: "LOSE" });
  });

  it("正解数が勝ち抜けポイントに達すると勝ち抜けになる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = Array.from({ length: 3 }, (_, i) => createLog("player-1", "correct", i));
    const game = createSwedish10Game(players, logs, { win_point: 3 });

    const result = computeSwedish10(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ state: "win", text: "1st" });
    expect(result.winPlayers).toHaveLength(1);
  });
});
