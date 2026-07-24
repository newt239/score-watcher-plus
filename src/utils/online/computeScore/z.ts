import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/**
 * Z形式のスコア計算
 *
 * ステージ1〜4をクリアしてステージ5へ到達すると勝ち抜けです。 誰かがステージをクリアすると、他のプレイヤーの正解数・誤答数・失格状態がリセットされます。
 */
const computeZ = (
  _game: Extract<GetGameDetailResponseType, { ruleType: "z" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s, stage: 1 }])
  );

  logs.forEach((log, qn) => {
    const s = byId.get(log.playerId || "");
    if (!s) return;

    const stage = s.stage;

    if (log.actionType === "correct") {
      const newCorrect = s.correct + 1;

      if (stage === 4 && newCorrect === 4) {
        // ステージ5に到達したため勝ち抜け
        s.correct = newCorrect;
        s.last_correct = qn;
        s.state = "win";
        s.is_incapacity = false;
      } else if (stage === newCorrect) {
        // ステージクリア。全員の正誤と失格状態をリセットする
        s.correct = 0;
        s.wrong = 0;
        s.stage = stage + 1;
        s.last_correct = qn;
        s.is_incapacity = false;

        for (const [otherId, other] of byId) {
          if (otherId !== s.player_id && other.state !== "win") {
            other.correct = 0;
            other.wrong = 0;
            other.is_incapacity = false;
            other.state = "playing";
          }
        }
      } else {
        s.correct = newCorrect;
        s.last_correct = qn;
        s.is_incapacity = false;
      }
    } else if (log.actionType === "wrong") {
      const newWrong = s.wrong + 1;

      if (stage === 1 && newWrong === 1) {
        // ステージ1では1問だけ解答権を失う
        s.wrong = 0;
        s.last_wrong = qn;
      } else if (stage === newWrong + 1) {
        s.is_incapacity = true;
        s.last_wrong = qn;
        s.state = "lose";
      } else {
        s.wrong = newWrong;
        s.last_wrong = qn;
      }
    }

    // スコアはステージ番号として扱う
    s.score = s.stage;
  });

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    const isResting =
      score.is_incapacity || (logs.length === score.last_wrong + 1 && score.stage === 1);
    return {
      ...score,
      order,
      text: score.state === "win" ? indicator(order) : isResting ? "休" : `Stage${score.stage}`,
    };
  });

  const winPlayers = finalScores
    .filter((s) => s.state === "win")
    .filter(() => logs.length > 0)
    .filter((s) => s.last_correct === logs.length - 1)
    .map((s) => ({ player_id: s.player_id, text: s.text }));

  return { scores: finalScores, winPlayers } as const;
};

export default computeZ;
