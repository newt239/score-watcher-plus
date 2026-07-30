import { describe, expect, it } from "vitest";

import computeEndlessChance from "../endless-chance";
import { getInitialPlayersStateForOnline } from "../index";

import type { GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type EndlessChanceGame = Extract<GetGameDetailResponseType, { ruleType: "endless-chance" }>;

/** EndlessChance形式のゲームデータを生成する。 */
const createEndlessChanceGame = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  option?: Partial<EndlessChanceGame["option"]>
): EndlessChanceGame => ({
  id: "game-endless-chance",
  name: "endless-chance",
  ruleType: "endless-chance" as const,
  option: { win_point: 3, lose_point: 3, lose_count: 3, use_r: false, ...option },
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

/** ゲームログを生成する。playerIdはカンマ区切りで複数指定できる。 */
const createLog = (
  playerId: string,
  actionType: SeriarizedGameLog["actionType"],
  index: number
): SeriarizedGameLog => ({
  id: `log-${index}`,
  gameId: "game-endless-chance",
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

describe("online endless-chance形式", () => {
  it("1件のmultiple_wrongログに含まれる全員の誤答を数える", () => {
    const players = [
      createPlayer("player-1", 0),
      createPlayer("player-2", 1),
      createPlayer("player-3", 2),
    ];
    const logs = [createLog("player-1,player-2", "multiple_wrong", 0)];
    const game = createEndlessChanceGame(players, logs);

    const result = computeEndlessChance(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores.find((s) => s.player_id === "player-1")?.wrong).toBe(1);
    expect(result.scores.find((s) => s.player_id === "player-2")?.wrong).toBe(1);
    expect(result.scores.find((s) => s.player_id === "player-3")?.wrong).toBe(0);
  });

  it("誤答数が失格誤答数に達すると敗退になる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = [
      createLog("player-1", "multiple_wrong", 0),
      createLog("-", "through", 1),
      createLog("player-1", "multiple_wrong", 2),
      createLog("-", "through", 3),
      createLog("player-1", "multiple_wrong", 4),
    ];
    const game = createEndlessChanceGame(players, logs);

    const result = computeEndlessChance(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ wrong: 3, state: "lose", text: "LOSE" });
  });

  it("正解数が勝ち抜けポイントに達すると勝ち抜けになる", () => {
    const players = [createPlayer("player-1", 0)];
    const logs = Array.from({ length: 3 }, (_, i) => createLog("player-1", "correct", i));
    const game = createEndlessChanceGame(players, logs);

    const result = computeEndlessChance(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores[0]).toMatchObject({ correct: 3, state: "win", text: "1st" });
    expect(result.winPlayers).toHaveLength(1);
  });

  it("NOM休を有効にすると誤答したプレイヤーが休みになる", () => {
    const players = [createPlayer("player-1", 0), createPlayer("player-2", 1)];
    const logs = [createLog("player-1", "multiple_wrong", 0)];
    const game = createEndlessChanceGame(players, logs, { use_r: true });

    const result = computeEndlessChance(game, getInitialPlayersStateForOnline(game), logs);

    const target = result.scores.find((s) => s.player_id === "player-1");
    expect(target?.is_incapacity).toBe(true);
    expect(target?.text).toBe("3休");
  });

  it("NOM休の休み問題数を消化すると解答権が戻る", () => {
    const players = [createPlayer("player-1", 0), createPlayer("player-2", 1)];
    // 休み3問分（誤答した問題を含めて4問）を消化すると解答権が戻る
    const logs = [
      createLog("player-1", "multiple_wrong", 0),
      createLog("player-2", "correct", 1),
      createLog("player-2", "correct", 2),
      createLog("player-2", "correct", 3),
      createLog("player-2", "correct", 4),
    ];
    const game = createEndlessChanceGame(players, logs, { use_r: true, win_point: 10 });

    const result = computeEndlessChance(game, getInitialPlayersStateForOnline(game), logs);

    expect(result.scores.find((s) => s.player_id === "player-1")?.is_incapacity).toBe(false);
  });
});
