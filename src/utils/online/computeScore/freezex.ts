import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/** FreezeX形式のスコア計算 X回正解で勝ち抜け、N回目の誤答でN問休み */
const computeFreezex = (
  game: Extract<GetGameDetailResponseType, { ruleType: "freezex" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const winPoint = game.option.win_point;

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    if (log.actionType === "correct") {
      s.correct += 1;
      s.score = s.correct;
      s.last_correct = qn;

      if (s.correct >= winPoint) {
        s.state = "win";
      } else if (s.correct === winPoint - 1) {
        s.reach_state = "win";
      }
    } else if (log.actionType === "wrong") {
      s.wrong += 1;
      s.last_wrong = qn;
    }
  });

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    // N回目の誤答でN問休みとなるため、誤答数から経過問題数を引いた分だけ休みが残る
    const remainIncapacity = score.wrong - (logs.length - score.last_wrong - 1);
    return {
      ...score,
      order,
      is_incapacity: remainIncapacity > 0,
      text:
        score.state === "win"
          ? indicator(order)
          : remainIncapacity > 0
            ? `${remainIncapacity}休`
            : `${score.correct}○`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeFreezex;
