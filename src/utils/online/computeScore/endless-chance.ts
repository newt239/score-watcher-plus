import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/**
 * EndlessChance形式のスコア計算
 *
 * 1つの問題に対して正解が出るまで複数人が解答できます。誤答は multiple_wrong ログに 解答者をまとめて記録し、正解またはスルーが記録された時点で次の問題へ進みます。
 */
const computeEndlessChance = (
  game: Extract<GetGameDetailResponseType, { ruleType: "endless-chance" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const winPoint = game.option.win_point;
  const losePoint = game.option.lose_count;
  const useR = game.option.use_r;

  // 正解・スルーで1問進む。最後が誤答のみの場合も出題中の1問として数える
  const realQuizLength =
    logs.filter((log) => log.actionType === "correct" || log.actionType === "through").length +
    (logs.length !== 0 && logs[logs.length - 1].actionType === "multiple_wrong" ? 1 : 0);

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  let currentQn = 0;

  logs.forEach((log) => {
    if (log.actionType === "correct" || log.actionType === "through") {
      currentQn++;
    }

    // multiple_wrong はカンマ区切りで複数の解答者を持つ
    const answeredPlayerIds = (log.playerId ?? "").split(",").filter((id) => id !== "");

    for (const [playerId, s] of byId) {
      if (answeredPlayerIds.includes(playerId)) {
        if (log.actionType === "correct") {
          s.correct += 1;
          s.score = s.correct;
          s.last_correct = currentQn;

          if (s.correct >= winPoint) {
            s.state = "win";
          } else if (s.correct + 1 === winPoint) {
            s.reach_state = "win";
          }
        } else if (log.actionType === "multiple_wrong" || log.actionType === "wrong") {
          s.wrong += 1;
          s.last_wrong = currentQn;

          if (useR) {
            // NOM休を使う場合は誤答するたびに一定の問題数だけ休みになる
            s.is_incapacity = true;
          } else if (s.wrong >= losePoint) {
            s.state = "lose";
          } else if (s.wrong + 1 === losePoint && s.correct + 1 !== winPoint) {
            s.reach_state = "lose";
          }
        }
      } else if (useR && s.is_incapacity && losePoint <= realQuizLength - s.last_wrong - 1) {
        // 休みの問題数を消化したプレイヤーは解答権が戻る
        s.is_incapacity = false;
        s.state = "playing";
      }
    }
  });

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    return {
      ...score,
      order,
      text:
        score.state === "win"
          ? indicator(order)
          : score.is_incapacity
            ? `${losePoint - realQuizLength + score.last_wrong + 1}休`
            : score.state === "lose"
              ? "LOSE"
              : `${score.score}pt`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === realQuizLength)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeEndlessChance;
