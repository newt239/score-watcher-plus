import { describe, expect, it } from "vitest";

import {
  countNewResources,
  filterLocalData,
  findMatchedPlayerIds,
  listQuizSets,
} from "./local-data";

import type { LocalExportFileType } from "@/models/migration";

const gamePlayer = (id: string, name: string) => ({ id, name });

const data: LocalExportFileType = {
  games: [
    { id: "g1", name: "第1ラウンド", rule: "normal", players: [gamePlayer("p1", "Alice")] },
    {
      id: "g2",
      name: "第2ラウンド",
      rule: "nomx",
      players: [gamePlayer("p2", "Bob"), gamePlayer("p9", "Zed")],
    },
  ],
  players: [
    { id: "p1", name: "Alice", tags: ["A組"] },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Carol" },
    { id: "p4", name: "Alice" },
  ],
  quizes: [
    { id: "q1", n: 1, q: "問1", a: "答1", set_name: "セットA" },
    { id: "q2", n: 2, q: "問2", a: "答2", set_name: "セットA" },
    { id: "q3", n: 1, q: "問3", a: "答3", set_name: "" },
  ],
  logs: [
    { id: "l1", game_id: "g1", player_id: "p1", variant: "correct" },
    { id: "l2", game_id: "g2", player_id: "p2", variant: "wrong" },
  ],
};

describe("listQuizSets", () => {
  it("セット名が空の問題はインポートにまとめて数える", () => {
    expect(listQuizSets(data)).toEqual([
      { name: "セットA", count: 2 },
      { name: "インポート", count: 1 },
    ]);
  });
});

describe("filterLocalData", () => {
  it("選んだゲームの参加者とログは自動で含め、問題はセット単位で絞り込む", () => {
    const filtered = filterLocalData(data, {
      gameIds: ["g2"],
      quizSetNames: ["インポート"],
      playerIds: ["p3"],
    });

    expect(filtered.games.map((g) => g.id)).toEqual(["g2"]);
    expect(filtered.players.map((p) => p.id)).toEqual(["p2", "p3"]);
    expect(filtered.quizes.map((q) => q.id)).toEqual(["q3"]);
    expect(filtered.logs.map((l) => l.id)).toEqual(["l2"]);
  });
});

describe("countNewResources", () => {
  it("同名のプレイヤーは1人として数え、既存と一致したプレイヤーは数えない", () => {
    expect(countNewResources(data, [])).toEqual({ game: 2, player: 4, quiz: 3 });
    expect(countNewResources(data, ["p2"])).toEqual({ game: 2, player: 3, quiz: 3 });
  });
});

describe("findMatchedPlayerIds", () => {
  it("IDか名前が既存プレイヤーと一致するローカルのプレイヤーを返す", () => {
    expect(
      findMatchedPlayerIds(data, [
        { id: "p3", name: "別名" },
        { id: "x", name: "Alice" },
      ])
    ).toEqual(["p1", "p3", "p4"]);
  });
});
