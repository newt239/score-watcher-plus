import { describe, expect, it } from "vitest";

import computeAttackSurvival from "../attacksurvival";
import {
  generateScoreText,
  getInitialPlayersStateForOnline,
  getSortedPlayerOrderListForOnline,
} from "../index";

import type { ComputedScoreProps, GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type AttackSurvivalGame = Extract<GetGameDetailResponseType, { ruleType: "attacksurvival" }>;

/**
 * Attacksurvival形式のゲームデータを生成する。
 *
 * @param players ゲームに参加するプレイヤー一覧
 * @param logs 適用するゲームログ
 * @param option オプション設定
 * @returns Attacksurvival形式のゲーム設定
 */
const createAttackSurvivalGame = (
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[],
  option: AttackSurvivalGame["option"]
): AttackSurvivalGame => ({
  id: "game-attacksurvival",
  name: "attacksurvival",
  ruleType: "attacksurvival" as const,
  option,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
  discordWebhookUrl: null,
  quizSetName: null,
  quizOffset: 0,
  isPublic: false,
  userId: "user-1",
  players,
  logs,
});

/**
 * ゲーム参加者を生成する。
 *
 * @param id プレイヤーID
 * @param initialCorrectCount 個人の初期値（持ち点への加算分）
 * @param displayOrder 表示順
 * @returns プレイヤー設定
 */
const createPlayer = (
  id: string,
  initialCorrectCount: number | null,
  displayOrder: number
): GamePlayerProps => ({
  id,
  name: id,
  description: "",
  affiliation: "",
  displayOrder,
  initialScore: 0,
  initialCorrectCount,
  initialWrongCount: 0,
});

/**
 * 計算済みスコアを生成する。
 *
 * @param override 上書きするスコア情報
 * @returns 計算済みスコア
 */
const createScoreState = (override: Partial<ComputedScoreProps>): ComputedScoreProps => ({
  game_id: "game-attacksurvival",
  player_id: "player-base",
  state: "playing",
  reach_state: "playing",
  score: 0,
  correct: 0,
  wrong: 0,
  last_correct: -10,
  last_wrong: -10,
  odd_score: 0,
  even_score: 0,
  stage: 1,
  is_incapacity: false,
  order: 0,
  text: "",
  ...override,
});

describe("online attacksurvival形式", () => {
  const baseOption: AttackSurvivalGame["option"] = {
    win_point: 15,
    win_through: 1,
    correct_me: 2,
    wrong_me: -2,
    correct_other: -3,
    wrong_other: 1,
    limit: undefined,
  };

  it("初期状態でスコアが持ち点(win_point)と個人初期値の合算になる", () => {
    const players = [createPlayer("player-1", 3, 0), createPlayer("player-2", 1, 1)];
    const game = createAttackSurvivalGame(players, [], baseOption);

    const initialStates = getInitialPlayersStateForOnline(game);

    expect(initialStates).toMatchObject([
      {
        player_id: "player-1",
        score: 18,
        correct: 0,
        wrong: 0,
      },
      {
        player_id: "player-2",
        score: 16,
        correct: 0,
        wrong: 0,
      },
    ]);
    expect(generateScoreText(initialStates[0], 0)).toBe("18");
    expect(generateScoreText(initialStates[1], 1)).toBe("16");
  });

  it("スコアと勝敗状態を優先して並び替える", () => {
    const sorted = getSortedPlayerOrderListForOnline([
      createScoreState({
        player_id: "winner",
        state: "win",
        score: 10,
        last_correct: 2,
      }),
      createScoreState({
        player_id: "higher-score",
        score: 8,
        correct: 3,
      }),
      createScoreState({
        player_id: "lower-score",
        score: 5,
        correct: 4,
        wrong: 1,
      }),
      createScoreState({
        player_id: "more-wrong",
        score: 5,
        correct: 4,
        wrong: 2,
      }),
    ]);

    expect(sorted).toEqual(["winner", "higher-score", "lower-score", "more-wrong"]);
  });

  it("正解が他プレイヤーのスコアに影響し勝者を決定する", () => {
    const option: AttackSurvivalGame["option"] = {
      ...baseOption,
      win_point: 5,
      win_through: 1,
    };
    const players = [createPlayer("player-1", 0, 0), createPlayer("player-2", 0, 1)];
    const logs: SeriarizedGameLog[] = [
      {
        id: "log-1",
        gameId: "game-attacksurvival",
        playerId: "player-1",
        questionNumber: 0,
        actionType: "correct",
        scoreChange: 0,
        timestamp: "2024-01-01T00:00:01.000Z",
        isSystemAction: false,
        deletedAt: null,
        userId: "user-1",
      },
      {
        id: "log-2",
        gameId: "game-attacksurvival",
        playerId: "player-1",
        questionNumber: 1,
        actionType: "correct",
        scoreChange: 0,
        timestamp: "2024-01-01T00:00:02.000Z",
        isSystemAction: false,
        deletedAt: null,
        userId: "user-1",
      },
    ];

    const game = createAttackSurvivalGame(players, logs, option);
    const initialStates = getInitialPlayersStateForOnline(game);
    const result = computeAttackSurvival(game, initialStates, logs);

    const player1 = result.scores.find((s) => s.player_id === "player-1");
    const player2 = result.scores.find((s) => s.player_id === "player-2");

    // p1: 5 +2 +2 = 9 / p2: 5 -3 -3 = -1 → 0にクランプされて失格 → 残り1人でp1勝ち抜け
    expect(player1).toMatchObject({
      score: 9,
      state: "win",
      correct: 2,
      text: "1st",
    });
    expect(player2).toMatchObject({
      score: 0,
      state: "lose",
      text: "LOSE",
    });
    expect(result.winPlayers).toEqual([
      {
        player_id: "player-1",
        text: "1st",
      },
    ]);
  });
});
