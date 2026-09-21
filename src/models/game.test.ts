import { describe, expect, it } from "vitest";

import { GameLogRowSchema, type GameLogRowType } from "./game";

import type { SeriarizedGameLog } from "@/utils/drizzle/types";

const buildRepositoryLog = () => ({
  id: "3yPpnUS5C1vRHo9QP7kGa",
  gameId: "0MxcRzaLKUKT7EHY-aMh2",
  playerId: "Zk0zqEc4NGvFctCgPKuOn",
  questionNumber: null,
  actionType: "correct" as const,
  scoreChange: 0,
  panel: null,
  removedPanel: null,
  timestamp: new Date("2026-09-21T12:00:00.123Z"),
  isSystemAction: false,
  deletedAt: null,
  userId: "iQOjgFk7yfIDvqtLc6Vb2",
});

const serializeLog = (log: ReturnType<typeof buildRepositoryLog>): SeriarizedGameLog => ({
  ...log,
  timestamp: log.timestamp?.toISOString() || "",
  deletedAt: null,
});

describe("GameLogRowSchema", () => {
  it("serializeGameForComputeと同じ形のログを受理する", () => {
    const parsed = GameLogRowSchema.parse(serializeLog(buildRepositoryLog()));

    expect(parsed.timestamp).toBe("2026-09-21T12:00:00.123Z");
  });

  it("nullを取りうるフィールドをすべて受理する", () => {
    const parsed = GameLogRowSchema.parse({
      ...serializeLog(buildRepositoryLog()),
      gameId: null,
      playerId: null,
      scoreChange: null,
      isSystemAction: null,
      userId: null,
    });

    expect(parsed.playerId).toBeNull();
  });

  it("アタック25のパネル情報を受理する", () => {
    const parsed = GameLogRowSchema.parse({
      ...serializeLog(buildRepositoryLog()),
      panel: 12,
      removedPanel: 0,
    });

    expect(parsed.panel).toBe(12);
  });

  it("未知のactionTypeは拒否する", () => {
    expect(
      GameLogRowSchema.safeParse({ ...serializeLog(buildRepositoryLog()), actionType: "unknown" })
        .success
    ).toBe(false);
  });
});

describe("GameLogRowType", () => {
  it("SeriarizedGameLogと相互に代入できる", () => {
    const serialized: SeriarizedGameLog = serializeLog(buildRepositoryLog());
    const row: GameLogRowType = serialized;
    const backToSerialized: SeriarizedGameLog = row;

    expect(backToSerialized).toEqual(serialized);
  });
});
