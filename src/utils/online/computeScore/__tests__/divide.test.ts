import { describe, expect, it } from "vitest";

import computeDivide from "../divide";
import { getInitialPlayersStateForOnline } from "../index";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type DivideGame = Extract<GetGameDetailResponseType, { ruleType: "divide" }>;

/** Divide形式のゲームデータを生成する。 */
const createDivideGame = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  option?: Partial<DivideGame["option"]>
): DivideGame => ({
  id: "game-divide",
  name: "divide",
  ruleType: "divide" as const,
  option: { win_point: 100, correct_me: 10, ...option },
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
  gameId: "game-divide",
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

describe("online divide形式", () => {
  it("持ち点をcorrect_meで開始し、正解するたびに同じ点数を加算する", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [createLog("player-1", "correct", 0), createLog("player-1", "correct", 1)];
    const game = createDivideGame(players, logs);

    const result = computeDivide(game, getInitialPlayersStateForOnline(game), logs);

    // 初期値10 + 正解2回分20
    expect(result.scores[0]).toMatchObject({ score: 30, correct: 2, text: "30pt" });
  });

  it("誤答すると現在の得点を誤答回数に応じて割る", () => {
    const players = [createPlayer("player-1", 0)];
    // 初期10 + 正解3回で40pt、1回目の誤答で40/1、2回目の誤答で40/2
    const logs = [
      createLog("player-1", "correct", 0),
      createLog("player-1", "correct", 1),
      createLog("player-1", "correct", 2),
      createLog("player-1", "wrong", 3),
      createLog("player-1", "wrong", 4),
    ];
    const game = createDivideGame(players, logs);

    const result = computeDivide(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ score: 20, wrong: 2, text: "20pt" });
  });

  it("勝ち抜けポイントに到達すると勝ち抜けになる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [createLog("player-1", "correct", 0), createLog("player-1", "correct", 1)];
    const game = createDivideGame(players, logs, { win_point: 30 });

    const result = computeDivide(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ state: "win", text: "1st" });
    expect(result.winPlayers).toHaveLength(1);
  });
});
