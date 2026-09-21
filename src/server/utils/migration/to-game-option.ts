import { setupDefaultGameOption } from "@/server/utils/options";

import type { LocalGameType } from "@/models/migration";

/** ローカル版が平坦に持つルールパラメータのうち、Plusと同名のもの */
const FLAT_KEYS = [
  "correct_me",
  "wrong_me",
  "correct_other",
  "wrong_other",
  "win_point",
  "lose_point",
  "win_through",
  "limit",
] as const;

/**
 * ローカル版のゲームをPlusのgame.optionへ変換する
 *
 * ローカル版はルールパラメータをトップレベルに平坦に持つのに対し、Plusはoption jsonにまとめています。 大半は同名キーですが、ny / nomr /
 * endless-chanceは同じ値でもキー名と意味がずれているため詰め替えます。
 *
 * @param localGame ローカル版のゲーム1件
 * @returns Plusのgame.optionに入れる値
 */
export const toGameOption = (localGame: LocalGameType) => {
  const option: Record<string, boolean | number | string> = {};

  for (const key of FLAT_KEYS) {
    const value = localGame[key];
    if (typeof value === "number") {
      option[key] = value;
    }
  }

  for (const [key, value] of Object.entries(localGame.options ?? {})) {
    option[key] = value;
  }

  switch (localGame.rule) {
    case "ny":
      if (typeof localGame.win_point === "number") {
        option.target_point = localGame.win_point;
      }
      break;
    case "nomr":
      if (typeof localGame.lose_point === "number") {
        option.rest_count = localGame.lose_point;
      }
      break;
    case "endless-chance":
      if (typeof localGame.lose_point === "number") {
        option.lose_count = localGame.lose_point;
      }
      break;
    default:
      break;
  }

  return setupDefaultGameOption({ ruleType: localGame.rule, option });
};
