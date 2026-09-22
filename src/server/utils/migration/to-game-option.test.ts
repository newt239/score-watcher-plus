import { describe, expect, it } from "vitest";

import { toGameOption } from "./to-game-option";

import type { LocalGameType } from "@/models/migration";

/** ローカル版のゲーム1件を生成する。 */
const createLocalGame = (
  rule: LocalGameType["rule"],
  override: Partial<LocalGameType> = {}
): LocalGameType => ({
  id: "local-game",
  name: "テストゲーム",
  rule,
  players: [],
  ...override,
});

/** ルールパラメータを一切持たないゲームを変換したときに得られるoption */
const DEFAULT_OPTION_BY_RULE: Record<LocalGameType["rule"], Record<string, unknown>> = {
  normal: {},
  nomx: { win_point: 7, lose_point: 3 },
  "nomx-ad": { win_point: 7, lose_point: 3, streak_over3: true },
  ny: { win_point: 10, lose_point: 3, target_point: 10 },
  nomr: { win_point: 7, lose_point: 3, rest_count: 3 },
  nbyn: { win_point: 5, lose_point: 5 },
  nupdown: { win_point: 5, lose_point: 2 },
  divide: { win_point: 100, correct_me: 10 },
  swedish10: { win_point: 10, lose_point: 10 },
  backstream: { win_point: 10, lose_point: -10 },
  attacksurvival: {
    win_point: 15,
    win_through: 3,
    correct_me: 0,
    wrong_me: -2,
    correct_other: -1,
    wrong_other: 0,
  },
  squarex: { win_point: 16 },
  z: {},
  freezex: { win_point: 7 },
  "endless-chance": { win_point: 7, lose_point: 3, lose_count: 3, use_r: false },
  variables: { win_point: 30 },
  aql: { left_team: "Team A", right_team: "Team B" },
  attack25: { attack_chance: true },
};

const ALL_RULES = Object.keys(DEFAULT_OPTION_BY_RULE) as LocalGameType["rule"][];

describe("移行データのoption変換", () => {
  it.each(ALL_RULES)("%s はパラメータが無くてもPlusのデフォルトで埋まる", (rule) => {
    expect(toGameOption(createLocalGame(rule))).toEqual(DEFAULT_OPTION_BY_RULE[rule]);
  });

  it("ny の win_point が target_point に詰め替えられる", () => {
    const option = toGameOption(createLocalGame("ny", { win_point: 20, lose_point: 5 }));

    expect(option).toEqual({ win_point: 20, lose_point: 5, target_point: 20 });
  });

  it("nomr の lose_point が rest_count に詰め替えられる", () => {
    const option = toGameOption(createLocalGame("nomr", { win_point: 5, lose_point: 2 }));

    expect(option).toEqual({ win_point: 5, lose_point: 2, rest_count: 2 });
  });

  it("endless-chance の lose_point が lose_count に詰め替えられる", () => {
    const option = toGameOption(
      createLocalGame("endless-chance", {
        win_point: 4,
        lose_point: 2,
        options: { use_r: true },
      })
    );

    expect(option).toEqual({ win_point: 4, lose_point: 2, lose_count: 2, use_r: true });
  });

  it("nomx-ad の streak_over3 がoptionsから引き継がれる", () => {
    const option = toGameOption(
      createLocalGame("nomx-ad", { win_point: 3, lose_point: 2, options: { streak_over3: false } })
    );

    expect(option).toEqual({ win_point: 3, lose_point: 2, streak_over3: false });
  });

  it("aql のチーム名がoptionsから引き継がれる", () => {
    const option = toGameOption(
      createLocalGame("aql", {
        lose_point: 3,
        options: { left_team: "赤", right_team: "白" },
      })
    );

    expect(option).toEqual({ left_team: "赤", right_team: "白" });
  });

  it("attack25 の attack_chance がoptionsから引き継がれる", () => {
    const option = toGameOption(createLocalGame("attack25", { options: { attack_chance: false } }));

    expect(option).toEqual({ attack_chance: false });
  });

  it("attacksurvival のポイント設定がそのままコピーされる", () => {
    const option = toGameOption(
      createLocalGame("attacksurvival", {
        win_point: 20,
        win_through: 2,
        correct_me: 1,
        wrong_me: -3,
        correct_other: -2,
        wrong_other: -1,
      })
    );

    expect(option).toEqual({
      win_point: 20,
      win_through: 2,
      correct_me: 1,
      wrong_me: -3,
      correct_other: -2,
      wrong_other: -1,
    });
  });

  it("limit と win_through がコピーされる", () => {
    const option = toGameOption(
      createLocalGame("nomx", { win_point: 7, lose_point: 3, limit: 30, win_through: 2 })
    );

    expect(option).toEqual({ win_point: 7, lose_point: 3, limit: 30, win_through: 2 });
  });

  it("Plusの形式が持たないキーは捨てられる", () => {
    const option = toGameOption(
      createLocalGame("normal", { correct_me: 5, wrong_me: -5, win_point: 10, lose_point: 3 })
    );

    expect(option).toEqual({});
  });
});
