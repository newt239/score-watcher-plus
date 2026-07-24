import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/** Variables形式のスコア計算 プレイヤーごとに設定した変動値Nを使い、正解で+N、誤答で-2N */
const computeVariables = (
  game: Extract<GetGameDetailResponseType, { ruleType: "variables" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const winPoint = game.option.win_point;

  // プレイヤーごとの変動値Nを引けるようにしておく
  const baseCorrectPointById = new Map(
    game.players.map((player) => [player.id, player.baseCorrectPoint])
  );

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    const variableN = baseCorrectPointById.get(s.player_id) ?? 1;

    if (log.actionType === "correct") {
      s.correct += 1;
      s.score += variableN;
      s.last_correct = qn;

      if (s.score >= winPoint) {
        s.state = "win";
      } else if (s.score + variableN >= winPoint) {
        s.reach_state = "win";
      }
    } else if (log.actionType === "wrong") {
      s.wrong += 1;
      s.score -= variableN * 2;
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
      text:
        score.state === "win"
          ? indicator(order)
          : score.state === "lose"
            ? "LOSE"
            : `${score.score}pt`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeVariables;
