// 各ゲーム形式のコンピュータをインポート
import computeAql from "./aql";
import computeAttackSurvival from "./attacksurvival";
import computeBackstream from "./backstream";
import computeDivide from "./divide";
import computeEndlessChance from "./endless-chance";
import computeFreezex from "./freezex";
import { getInitialPlayersStateForOnline, indicator } from "./index";
import computeNbyn from "./nbyn";
import computeNomr from "./nomr";
import computeNomx from "./nomx";
import computeNomxAd from "./nomx-ad";
import computeNormal from "./normal";
import computeNupdown from "./nupdown";
import computeNy from "./ny";
import computeSquarex from "./squarex";
import computeSwedish10 from "./swedish10";
import computeVariables from "./variables";
import computeZ from "./z";

import type { ComputedScoreProps, GamePlayerProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

// WinPlayerPropsの代替型定義
type WinPlayerProps = {
  player_id: string;
  name: string;
  text: string;
};

/** スコア計算結果の型 */
type ComputeResult = {
  readonly scores: ComputedScoreProps[];
  readonly winPlayers: readonly { player_id: string; text: string }[];
};

/**
 * 限定問題数に達した場合に順位で勝ち抜け・敗退を確定させる
 *
 * 「限定問題数」と「勝ち抜け人数」が設定されているゲームで、規定の問題数を消化したときに 上位のプレイヤーを勝ち抜け、それ以外を敗退として扱います。
 *
 * @param game ゲーム情報
 * @param result 形式ごとのスコア計算結果
 * @param logs ゲームログ
 * @returns 判定を反映したスコア計算結果
 */
const applyQuestionLimit = (
  game: GetGameDetailResponseType,
  result: ComputeResult,
  logs: SeriarizedGameLog[]
): ComputeResult => {
  const limit = "limit" in game.option ? game.option.limit : undefined;
  const winThrough = "win_through" in game.option ? game.option.win_through : undefined;

  if (!limit || !winThrough || logs.length < limit) {
    return result;
  }

  const scores = result.scores.map((score) => {
    if (score.state === "win") return score;
    const state = score.order < winThrough ? "win" : "lose";
    return {
      ...score,
      state,
      text: state === "win" ? indicator(score.order) : "LOSE",
    } as const;
  });

  return { ...result, scores };
};

/** オンライン版のスコア計算（全形式対応） ローカル版と同じく17種類のゲーム形式に対応 */
export const computeOnlineScore = (
  game: GetGameDetailResponseType,
  players: GamePlayerProps[],
  logs: SeriarizedGameLog[]
) => {
  const initialState = getInitialPlayersStateForOnline(game);

  return applyQuestionLimit(game, computeByRule(game, initialState, logs), logs);
};

/** 形式ごとのスコア計算を振り分ける */
const computeByRule = (
  game: GetGameDetailResponseType,
  initialState: ReturnType<typeof getInitialPlayersStateForOnline>,
  logs: SeriarizedGameLog[]
): ComputeResult => {
  switch (game.ruleType) {
    case "normal":
      return computeNormal(game, initialState, logs);
    case "nomx":
      return computeNomx(game, initialState, logs);
    case "nomx-ad":
      return computeNomxAd(game, initialState, logs);
    case "ny":
      return computeNy(game, initialState, logs);
    case "nomr":
      return computeNomr(game, initialState, logs);
    case "nbyn":
      return computeNbyn(game, initialState, logs);
    case "nupdown":
      return computeNupdown(game, initialState, logs);
    case "divide":
      return computeDivide(game, initialState, logs);
    case "swedish10":
      return computeSwedish10(game, initialState, logs);
    case "backstream":
      return computeBackstream(game, initialState, logs);
    case "attacksurvival":
      return computeAttackSurvival(game, initialState, logs);
    case "squarex":
      return computeSquarex(game, initialState, logs);
    case "z":
      return computeZ(game, initialState, logs);
    case "freezex":
      return computeFreezex(game, initialState, logs);
    case "endless-chance":
      return computeEndlessChance(game, initialState, logs);
    case "variables":
      return computeVariables(game, initialState, logs);
    case "aql":
      return computeAql(game, initialState, logs);
    default:
      // 未対応形式の場合は初期状態を返す
      const scores = initialState.map((score, index) => ({
        ...score,
        order: index,
        text: String(score.score),
      }));
      return { scores, winPlayers: [] as WinPlayerProps[] } as const;
  }
};

export default computeOnlineScore;
