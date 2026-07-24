import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/** Divide形式のスコア計算 正解で加点し、誤答するたびに現在の得点を割っていく */
const computeDivide = (
  game: Extract<GetGameDetailResponseType, { ruleType: "divide" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const winPoint = game.option.win_point;
  const correctPoint = game.option.correct_me;

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    if (log.actionType === "correct") {
      s.correct += 1;
      s.score += correctPoint;
      s.last_correct = qn;

      if (s.score >= winPoint) {
        s.state = "win";
      } else if (s.score + 1 === winPoint) {
        s.reach_state = "win";
      } else {
        s.state = "playing";
        s.reach_state = "playing";
      }
    } else if (log.actionType === "wrong") {
      // 誤答するたびに割る数が1ずつ増えていく
      s.score = Math.floor(s.score / (s.wrong + 1));
      s.wrong += 1;
      s.last_wrong = qn;
    }
  });

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    return {
      ...score,
      order,
      text: score.state === "win" ? indicator(order) : `${score.score}pt`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeDivide;
