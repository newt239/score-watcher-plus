import { useCallback, useEffect, useMemo, useState } from "react";

import { Box, Button, Flex, Text, Tooltip } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useLiveQuery } from "@tanstack/react-db";
import { parseResponse } from "hono/client";
import { nanoid } from "nanoid";

import { nextLogTimestamp } from "@/utils/db/log-timestamp";
import createApiClient from "@/utils/hono/browser";
import { notifyApiError } from "@/utils/notify-error";
import { computeOnlineScore } from "@/utils/online/computeScore/computeOnlineScore";

import { useBoardDb } from "../../_hooks/use-board-db";
import ActionButtons from "../ActionButtons/ActionButtons";
import AQL from "../AQL/AQL";
import Attack25 from "../Attack25/Attack25";
import BoardHeader from "../BoardHeader/BoardHeader";
import GameLogs from "../GameLogs/GameLogs";
import InAppBrowserWarning from "../InAppBrowserWarning/InAppBrowserWarning";
import Players from "../Players/Players";
import WinModal from "../WinModal/WinModal";
import classes from "./Board.module.css";

import type {
  BoardQuizType,
  GameLogRowType,
  GamePlayerProps,
  GetGameDetailResponseType,
  LogDBProps,
  OnlineUserType,
} from "@/models/game";
import type { UserPreferencesType } from "@/models/user-preference";

type BoardProps = {
  gameId: string;
  user: OnlineUserType | null;
  initialGame: GetGameDetailResponseType;
  initialPreferences: UserPreferencesType | null;
  quizList: BoardQuizType[];
};

const Board: React.FC<BoardProps> = ({
  gameId,
  user,
  initialGame,
  initialPreferences,
  quizList,
}) => {
  const { logsCollection, runLogMutation, pausePolling } = useBoardDb();
  const { data: logs } = useLiveQuery({
    query: (q) =>
      q
        .from({ log: logsCollection })
        .orderBy(({ log }) => log.timestamp, "asc")
        .orderBy(({ log }) => log.id, "asc"),
  });

  const [players] = useState<GamePlayerProps[]>(initialGame.players);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [editable, setEditable] = useState(initialGame.editable);
  const [preferences] = useState<UserPreferencesType | null>(initialPreferences);
  const [dismissedWinPlayerId, setDismissedWinPlayerId] = useState<string | null>(null);
  const [dismissedSkipSuggestLogId, setDismissedSkipSuggestLogId] = useState<string | null>(null);

  const { scores, winPlayers } = useMemo(
    () => computeOnlineScore(initialGame, players, logs),
    [initialGame, players, logs]
  );

  // エンドレスチャンスの誤答は同じ問題への解答なので、問題番号を進めない
  const questionNumber = logs.filter((log) => log.actionType !== "multiple_wrong").length;
  // スキップは問題番号だけを進める操作なので、表示する問題文は据え置く
  const answeredCount = logs.filter(
    (log) => log.actionType !== "multiple_wrong" && log.actionType !== "skip"
  ).length;
  const quizPosition = initialGame.quizOffset + answeredCount - 1;

  const winPlayer = winPlayers?.[0];
  const winPlayerName = winPlayer
    ? players.find((player) => player.id === winPlayer.player_id)?.name
    : undefined;
  const showWinModal =
    Boolean(winPlayer && winPlayerName) && winPlayer?.player_id !== dismissedWinPlayerId;

  const skipSuggestLogId = useMemo(() => {
    const last = logs[logs.length - 1];
    if (!last) return null;

    const playingPlayers = scores.filter((score) => score.state === "playing");
    const incapacityPlayers = playingPlayers.filter((score) => score.is_incapacity);

    const allWrong =
      last.actionType === "multiple_wrong" &&
      typeof last.playerId === "string" &&
      last.playerId.split(",").length === playingPlayers.length;
    const allRest = playingPlayers.length > 0 && playingPlayers.length === incapacityPlayers.length;

    return allWrong || allRest ? last.id : null;
  }, [logs, scores]);
  const skipSuggest = skipSuggestLogId !== null && skipSuggestLogId !== dismissedSkipSuggestLogId;

  const addLog = useCallback(
    (
      playerId: string,
      actionType: LogDBProps["variant"],
      options?: { panel?: number; removedPanel?: number }
    ) => {
      const log: GameLogRowType = {
        id: nanoid(),
        gameId,
        playerId,
        questionNumber: null,
        actionType,
        scoreChange: 0,
        panel: options?.panel ?? null,
        removedPanel: options?.removedPanel ?? null,
        timestamp: new Date(nextLogTimestamp()).toISOString(),
        isSystemAction: false,
        deletedAt: null,
        userId: user?.id ?? null,
      };

      runLogMutation(() => logsCollection.insert(log));
    },
    [gameId, user, logsCollection, runLogMutation]
  );

  const addThrough = useCallback(() => {
    addLog("-", "through");
  }, [addLog]);

  /**
   * エンドレスチャンスの誤答を切り替える
   *
   * 同じ問題に対する誤答は1件のログにまとめて記録し、同じプレイヤーをもう一度押すと取り消します。
   */
  const toggleMultipleWrong = useCallback(
    (playerId: string) => {
      const lastLog = logs[logs.length - 1];

      if (lastLog?.actionType !== "multiple_wrong") {
        addLog(playerId, "multiple_wrong");
        return;
      }

      const answeredIds = (lastLog.playerId ?? "").split(",").filter((id) => id !== "");

      if (!answeredIds.includes(playerId)) {
        runLogMutation(() =>
          logsCollection.update(lastLog.id, (draft) => {
            draft.playerId = [...answeredIds, playerId].join(",");
          })
        );
        return;
      }

      const remainingIds = answeredIds.filter((id) => id !== playerId);

      if (remainingIds.length === 0) {
        runLogMutation(() => logsCollection.delete(lastLog.id));
        return;
      }

      runLogMutation(() =>
        logsCollection.update(lastLog.id, (draft) => {
          draft.playerId = remainingIds.join(",");
        })
      );
    },
    [logs, addLog, logsCollection, runLogMutation]
  );

  const toggleEditable = useCallback(() => {
    const nextValue = !editable;

    setEditable(nextValue);
    pausePolling(nextValue);

    void parseResponse(
      createApiClient().games[":gameId"].$patch({
        param: { gameId },
        json: { key: "editable", value: nextValue },
      })
    ).catch((error: unknown) => {
      setEditable(!nextValue);
      pausePolling(!nextValue);
      notifyApiError(error, "スコアの手動更新モードの切り替えに失敗しました");
    });
  }, [editable, gameId, pausePolling]);

  const undo = useCallback(() => {
    const last = logs[logs.length - 1];
    if (!last) return;

    runLogMutation(() => logsCollection.delete(last.id));
  }, [logs, logsCollection, runLogMutation]);

  // キーボードショートカット
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!initialGame) return;
      // 手動更新モードではスコアを直接入力するため、ショートカットを無効にする
      if (editable) return;
      // アタック25は盤面のパネル選択で解答するため、数字キーの解答は無効にする
      if (initialGame.ruleType === "attack25") {
        if (event.code === "Comma" || (event.code === "KeyZ" && (event.ctrlKey || event.metaKey))) {
          undo();
        }
        return;
      }
      if (event.code.startsWith("Digit") || event.code.startsWith("Numpad")) {
        const code = event.code.startsWith("Digit") ? event.code[5] : event.code[6];
        const idx = Number(code);
        if (!Number.isNaN(idx) && players.length > 0) {
          let player = players[idx - 1];
          if (idx === 0 && players.length >= 10) player = players[9];
          if (player) {
            if (event.shiftKey) {
              // エンドレスチャンスの誤答は1問分をまとめて記録する
              if (initialGame.ruleType === "endless-chance") {
                toggleMultipleWrong(player.id);
              } else {
                addLog(player.id, "wrong");
              }
            } else {
              addLog(player.id, "correct");
            }
          }
        }
      } else if (
        event.code === "Comma" ||
        (event.code === "KeyZ" && (event.ctrlKey || event.metaKey))
      ) {
        undo();
      } else if (event.code === "Period") {
        addLog("-", "through");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [players, addLog, undo, initialGame, editable, toggleMultipleWrong]);

  if (!user) {
    return (
      <Box className={classes.error}>
        <Text>サインインが必要です</Text>
      </Box>
    );
  }

  return (
    <>
      <InAppBrowserWarning />
      <BoardHeader
        game={{
          id: initialGame.id,
          name: initialGame.name,
          ruleType: initialGame.ruleType,
        }}
        logsLength={logs.length}
        questionNumber={questionNumber}
        quizPosition={quizPosition}
        quizList={quizList}
        onUndo={undo}
        onThrough={addThrough}
        preferences={preferences}
        userId={user.id}
        editable={editable}
        onToggleEditable={toggleEditable}
      />
      {initialGame.ruleType === "squarex" && (
        <Box
          className={classes.squarex_bar}
          style={{
            left: logs.length % 2 === 0 ? 0 : undefined,
            right: logs.length % 2 === 1 ? 0 : undefined,
          }}
        />
      )}
      {initialGame.ruleType === "attack25" ? (
        <Attack25
          players={players}
          logs={logs}
          isPending={false}
          onAddLog={addLog}
          attackChance={initialGame.option.attack_chance}
          show_header={preferences?.showBoardHeader ?? true}
        />
      ) : initialGame.ruleType === "aql" ? (
        <AQL
          scores={scores}
          players={players}
          onAddLog={addLog}
          team_name={{
            left_team: initialGame.option.left_team ?? "",
            right_team: initialGame.option.right_team ?? "",
          }}
          show_header={preferences?.showBoardHeader ?? true}
        />
      ) : (
        <Players
          game={initialGame}
          scores={scores}
          players={players}
          onAddLog={addLog}
          preferences={preferences}
          showQuiz={quizList.length > 0}
          editable={editable}
          onToggleMultipleWrong={toggleMultipleWrong}
        />
      )}

      <ActionButtons
        game={initialGame}
        logsLength={logs.length}
        onUndo={undo}
        onThrough={addThrough}
        userId={user.id}
        preferences={preferences}
        editable={editable}
        onToggleEditable={toggleEditable}
      />

      <GameLogs
        logs={logs}
        players={players}
        order={order}
        onToggleOrder={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
        quizList={quizList}
        quizOffset={initialGame.quizOffset}
      />

      <WinModal
        onClose={() => setDismissedWinPlayerId(winPlayer?.player_id ?? null)}
        winTroughPlayer={
          showWinModal && winPlayerName && winPlayer
            ? { name: winPlayerName, text: winPlayer.text }
            : { name: "", text: "" }
        }
        roundName=""
      />

      {skipSuggest && (
        <Flex className={classes.skip_suggest}>
          <Box>すべてのプレイヤーが休みの状態です。1問スルーしますか？</Box>
          <Flex gap="sm">
            <Button color="blue" onClick={() => addLog("-", "through")} size="sm">
              スルー
            </Button>
            <Box visibleFrom="md">
              <Tooltip label="問題番号が進みますが、問題は更新されません。">
                <Button onClick={() => addLog("-", "skip")} size="sm">
                  スキップ
                </Button>
              </Tooltip>
            </Box>
            <Button
              leftSection={<IconX />}
              onClick={() => setDismissedSkipSuggestLogId(skipSuggestLogId)}
              size="sm"
              color="red"
            >
              閉じる
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default Board;
