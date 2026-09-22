import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import { gameLog } from "./game";

const foreignKeyColumnNames = () =>
  getTableConfig(gameLog).foreignKeys.flatMap((foreignKey) =>
    foreignKey.reference().columns.map((column) => column.name)
  );

describe("game_logの外部キー", () => {
  it("player_idは外部キーにしない（スルーやスキップの-と、エンドレスチャンスのカンマ区切りを入れるため）", () => {
    expect(foreignKeyColumnNames()).not.toContain("player_id");
  });

  it("game_idとuser_idは外部キーのままにする", () => {
    expect(foreignKeyColumnNames()).toEqual(expect.arrayContaining(["game_id", "user_id"]));
  });
});
