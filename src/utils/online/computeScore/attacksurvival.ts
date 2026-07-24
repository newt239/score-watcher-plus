import { generateScoreText, getSortedPlayerOrderListForOnline } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/** AttackSurvival形式のスコア計算 正解で他のプレイヤーのポイントを減らし、誤答で自分のポイントが減る */
const computeAttackSurvival = (
  game: Extract<GetGameDetailResponseType, { ruleType: "attacksurvival" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const correctMe = game.option.correct_me; // 正解時の自分への影響
  const wrongMe = game.option.wrong_me; // 誤答時の自分への影響
  const correctOther = game.option.correct_other; // 正解時の他プレイヤーへの影響
  const wrongOther = game.option.wrong_other; // 誤答時の他プレイヤーへの影響
  const winThrough = game.option.win_through; // 勝ち抜け人数

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    if (log.actionType === "correct") {
      // 正解者自身の処理
      const newScore = s.score + correctMe;
      s.correct += 1;
      s.score = newScore;
      s.last_correct = qn;

      if (newScore + wrongMe <= 0) {
        s.reach_state = "lose";
      }
    } else if (log.actionType === "wrong") {
      // 誤答者自身の処理
      const newScore = s.score + wrongMe;
      s.wrong += 1;
      s.score = newScore;
      s.last_wrong = qn;

      if (newScore <= 0) {
        s.state = "lose";
      } else if (newScore + wrongMe <= 0) {
        s.reach_state = "lose";
      }
    }

    // 他のプレイヤーへの影響（正解時: correct_other / 誤答時: wrong_other）
    const otherDelta = log.actionType === "correct" ? correctOther : wrongOther;
    if (log.actionType === "correct" || log.actionType === "wrong") {
      for (const [otherId, otherState] of byId) {
        if (otherId !== log.playerId && otherState.state === "playing") {
          const otherNewScore = otherState.score + otherDelta;

          if (otherNewScore <= 0) {
            otherState.score = 0;
            otherState.state = "lose";
          } else {
            otherState.score = otherNewScore;
            if (otherNewScore + correctOther <= 0 || otherNewScore + wrongMe <= 0) {
              otherState.reach_state = "lose";
            }
          }
        }
      }
    }
  });

  // 生き残りが勝ち抜け人数以下になった場合、生き残っているプレイヤーを勝ち抜けとする
  const playingCount = [...byId.values()].filter((p) => p.state === "playing").length;
  if (winThrough && playingCount <= winThrough) {
    for (const state of byId.values()) {
      if (state.state === "playing") {
        state.state = "win";
      }
    }
  }

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    return {
      ...score,
      order,
      text: generateScoreText(score, order),
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeAttackSurvival;
