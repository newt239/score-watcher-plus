import { describe, expect, it } from "vitest";

import { computeOnlineScore } from "../computeOnlineScore";
import { getInitialPlayersStateForOnline } from "../index";
import computeVariables from "../variables";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type VariablesGame = Extract<GetGameDetailResponseType, { ruleType: "variables" }>;

/** Variables形式のゲームデータを生成する。 */
const createVariablesGame = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  option?: Partial<VariablesGame["option"]>
): VariablesGame => ({
  id: "game-variables",
  name: "variables",
  ruleType: "variables" as const,
  option: { win_point: 10, ...option },
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

/** 変動値Nを指定してゲーム参加者を生成する。 */
const createPlayer = (
  id: string,
  baseCorrectPoint: number,
  displayOrder: number
): GamePlayerProps => ({
  id,
  name: id,
  description: "",
  affiliation: "",
  displayOrder,
  initialScore: 0,
  initialCorrectCount: 0,
  initialWrongCount: 0,
  baseCorrectPoint,
});

/** ゲームログを生成する。 */
const createLog = (
  playerId: string,
  actionType: SeriarizedGameLog["actionType"],
  index: number
): SeriarizedGameLog => ({
  id: `log-${index}`,
  gameId: "game-variables",
  playerId,
  questionNumber: index,
  actionType,
  scoreChange: 0,
  timestamp: `2024-01-01T00:00:0${index}.000Z`,
  isSystemAction: false,
  panel: null,
  removedPanel: null,
  deletedAt: null,
  userId: "user-1",
});

describe("online variables形式", () => {
  it("正解でプレイヤーごとの変動値Nだけ加点する", () => {
    const players = [createPlayer("player-1", 3, 0), createPlayer("player-2", 5, 1)];
    const logs = [createLog("player-1", "correct", 0), createLog("player-2", "correct", 1)];
    const game = createVariablesGame(players, logs);

    const result = computeVariables(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores.find((s) => s.player_id === "player-1")).toMatchObject({
      score: 3,
      correct: 1,
      text: "3pt",
    });
    expect(result.scores.find((s) => s.player_id === "player-2")).toMatchObject({
      score: 5,
      correct: 1,
      text: "5pt",
    });
  });

  it("誤答で変動値Nの2倍を減点する", () => {
    const players = [createPlayer("player-1", 4, 0)];
    const logs = [createLog("player-1", "wrong", 0)];
    const game = createVariablesGame(players, logs);

    const result = computeVariables(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({
      score: -8,
      wrong: 1,
      text: "-8pt",
    });
  });

  it("勝ち抜けポイントに到達したプレイヤーを勝ち抜けにする", () => {
    const players = [createPlayer("player-1", 5, 0)];
    const logs = [createLog("player-1", "correct", 0), createLog("player-1", "correct", 1)];
    const game = createVariablesGame(players, logs);

    const result = computeVariables(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ score: 10, state: "win", text: "1st" });
    expect(result.winPlayers).toHaveLength(1);
  });

  it("あと1回の正解で勝ち抜けとなる場合はリーチ状態になる", () => {
    const players = [createPlayer("player-1", 6, 0)];
    const logs = [createLog("player-1", "correct", 0)];
    const game = createVariablesGame(players, logs);

    const result = computeVariables(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ score: 6, reach_state: "win" });
  });

  it("限定問題数に達したとき上位が勝ち抜け・それ以外が敗退となる", () => {
    const players = [createPlayer("player-1", 3, 0), createPlayer("player-2", 1, 1)];
    const logs = [createLog("player-1", "correct", 0), createLog("player-2", "correct", 1)];
    const game = createVariablesGame(players, logs, { limit: 2, win_through: 1 });

    const result = computeOnlineScore(game, players, logs);

    expect(result.scores.find((s) => s.player_id === "player-1")).toMatchObject({
      state: "win",
      text: "1st",
    });
    expect(result.scores.find((s) => s.player_id === "player-2")).toMatchObject({
      state: "lose",
      text: "LOSE",
    });
  });
});
