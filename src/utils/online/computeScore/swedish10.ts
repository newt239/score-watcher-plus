import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/**
 * 正答数に応じた誤答時のダメージを求める
 *
 * 正解を重ねるほど誤答のダメージが大きくなります。
 *
 * @param correct 現在の正答数
 * @returns 加算される誤答ポイント
 */
const getWrongDamage = (correct: number) => {
  if (correct <= 0) return 1;
  if (correct <= 2) return 2;
  if (correct <= 5) return 3;
  return 4;
};

/** Swedish10形式のスコア計算 正答数に応じて誤答時のダメージポイントが変動 */
const computeSwedish10 = (
  game: Extract<GetGameDetailResponseType, { ruleType: "swedish10" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const winPoint = game.option.win_point;
  const losePoint = game.option.lose_point;

  // Swedish10ではscoreを誤答ポイントとして扱う
  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s, score: s.wrong }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    if (log.actionType === "correct") {
      s.correct += 1;
      s.last_correct = qn;

      if (s.correct >= winPoint) {
        s.state = "win";
      } else if (s.correct === winPoint - 1) {
        s.reach_state = "win";
      }
    } else if (log.actionType === "wrong") {
      const damage = getWrongDamage(s.correct);
      s.wrong += damage;
      s.score = s.wrong;
      s.last_wrong = qn;

      if (s.wrong >= losePoint) {
        s.state = "lose";
      } else if (s.wrong + damage >= losePoint) {
        s.reach_state = "lose";
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
          : score.state === "lose"
            ? "LOSE"
            : `${score.correct}pt`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeSwedish10;
