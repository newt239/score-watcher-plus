"use client";

import { useCallback, useEffect, useState } from "react";

import { Text } from "@mantine/core";

import createApiClient from "@/utils/hono/browser";
import { rules } from "@/utils/rules";

import ViewerAQLBoard from "../ViewerAQLBoard/ViewerAQLBoard";
import ViewerPlayer from "../ViewerPlayer/ViewerPlayer";
import classes from "./ViewerBoard.module.css";

import type { GetViewerBoardDataResponseType, Variants } from "@/models/game";

/** 観戦データの更新間隔（ミリ秒） */
const POLLING_INTERVAL_MS = 2000;

/** ログの種類ごとの日本語表記 */
const LOG_LABELS: Record<Variants, string> = {
  correct: "正解",
  wrong: "誤答",
  through: "スルー",
  mutiple_correct: "複数正解",
  multiple_wrong: "複数誤答",
  skip: "スキップ",
  blank: "空欄",
};

type ViewerBoardProps = {
  gameId: string;
  initialData: GetViewerBoardDataResponseType;
};

const ViewerBoard = ({ gameId, initialData }: ViewerBoardProps) => {
  const [gameData, setGameData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // APIから受け取ったプレイヤーデータをそのまま使用
  // すでにサーバー側で計算済みのスコアデータ
  const players = gameData.players;

  const fetchData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const apiClient = createApiClient();
      const response = await apiClient.viewer.games[":gameId"].board.$get({
        param: { gameId },
      });

      if (response.ok) {
        const result = await response.json();
        if ("data" in result) {
          setGameData(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch viewer data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, isLoading]);

  useEffect(() => {
    const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size="xl" fw={700} c="white">
          {gameData.game.name}
        </Text>
        <Text size="sm" c="dimmed">
          {rules[gameData.game.ruleType].name}
        </Text>
      </div>

      <div className={classes.board}>
        {gameData.game.ruleType === "aql" ? (
          <div className={classes.aql_board}>
            <ViewerAQLBoard players={players} />
          </div>
        ) : (
          <div className={classes.players_list}>
            {players.map((player) => (
              <ViewerPlayer key={player.player_id} player={player} />
            ))}
          </div>
        )}
      </div>

      <div className={classes.logs}>
        <Text size="lg" fw={600} mb="md" c="white">
          ゲームログ
        </Text>
        <div className={classes.logs_container}>
          {gameData.logs.length === 0 ? (
            <Text size="sm" c="dimmed">
              まだ解答はありません。
            </Text>
          ) : (
            gameData.logs
              .slice(-10)
              .reverse()
              .map((log, index) => {
                const player = gameData.players.find((p) => p.player_id === log.player_id);
                const questionNumber = gameData.logs.length - index;
                return (
                  <div key={log.id} className={classes.log_item}>
                    <Text size="sm" c="dimmed">
                      Q{questionNumber} {player ? player.name : "－"} / {LOG_LABELS[log.variant]}
                    </Text>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerBoard;
