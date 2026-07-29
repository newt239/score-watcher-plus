import { computeAttack25Board, countPanels } from "@/utils/online/attack25";

import { getSortedPlayerOrderListForOnline, indicator } from "./index";

import type { ComputedScoreProps, GetGameDetailResponseType } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

/**
 * アタック25形式のスコア計算。盤面の保持パネル数をスコアとし、全パネルが埋まったら順位を確定する。
 *
 * @param game アタック25のゲーム情報
 * @param playersState 各プレイヤーの初期状態
 * @param logs 時系列順のゲームログ
 * @returns 各プレイヤーのスコアと勝者情報
 */
const computeAttack25 = (
  game: Extract<GetGameDetailResponseType, { ruleType: "attack25" }>,
  playersState: ComputedScoreProps[],
  logs: SeriarizedGameLog[]
) => {
  const attackChanceEnabled = game.option.attack_chance;
  const { board } = computeAttack25Board(logs, attackChanceEnabled);
  const counts = countPanels(board);
  const boardFull = board.every((cell) => cell !== null);

  // 末尾のログを除いた盤面と比較し、このログでちょうど満杯になったかを判定する
  const prevBoardFull =
    logs.length > 0 &&
    computeAttack25Board(logs.slice(0, -1), attackChanceEnabled).board.every(
      (cell) => cell !== null
    );
  const filledThisLog = boardFull && !prevBoardFull;

  const byId = new Map<string, ComputedScoreProps>(
    playersState.map((s) => [s.player_id, { ...s }])
  );

  for (const s of byId.values()) {
    const playerLogs = logs.filter((log) => log.playerId === s.player_id);
    s.score = counts[s.player_id] ?? 0;
    s.correct = playerLogs.filter((log) => log.actionType === "correct").length;
    s.wrong = playerLogs.filter((log) => log.actionType === "wrong").length;
  }

  const scores = [...byId.values()];
  const playerOrderList = getSortedPlayerOrderListForOnline(scores);

  const winPlayers: { player_id: string; text: string }[] = [];
  const finalScores = scores.map((score) => {
    const order = playerOrderList.findIndex((id) => id === score.player_id);
    const state: ComputedScoreProps["state"] = boardFull
      ? order === 0
        ? "win"
        : "lose"
      : "playing";
    const text = state === "win" ? indicator(order) : `${score.score}枚`;
    if (state === "win" && filledThisLog) {
      winPlayers.push({ player_id: score.player_id, text });
    }
    return { ...score, order, state, text };
  });

  return { scores: finalScores, winPlayers } as const;
};

export default computeAttack25;
