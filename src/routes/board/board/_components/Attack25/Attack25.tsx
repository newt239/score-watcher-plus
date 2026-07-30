import { useState } from "react";

import { Box, Button, Flex, Text, UnstyledButton } from "@mantine/core";

import {
  applyReversiFlip,
  computeAttack25Board,
  countPanels,
  getClaimablePanels,
  isAttackChanceActive,
  PANEL_COUNT,
} from "@/utils/online/attack25";

import classes from "./Attack25.module.css";

import type { GamePlayerProps, LogDBProps } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";
import type { Attack25Board } from "@/utils/online/attack25";

/** プレイヤーの並び順に対応するパネルの色 */
const PLAYER_COLORS = ["red", "green", "white", "blue"] as const;

/** 色のスクリーンリーダー向け日本語ラベル */
const COLOR_LABELS: Record<string, string> = {
  red: "赤",
  green: "緑",
  white: "白",
  blue: "青",
  empty: "空き",
};

type Attack25Props = {
  players: GamePlayerProps[];
  logs: SeriarizedGameLog[];
  isPending: boolean;
  onAddLog: (
    playerId: string,
    actionType: LogDBProps["variant"],
    options?: { panel?: number; removedPanel?: number }
  ) => void;
  attackChance: boolean;
  show_header: boolean;
};

const Attack25: React.FC<Attack25Props> = ({
  players,
  logs,
  isPending,
  onAddLog,
  attackChance,
  show_header,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingClaim, setPendingClaim] = useState<{
    playerId: string;
    panel: number;
  } | null>(null);
  // 消せる相手パネルが無くアタックチャンスを通知だけして次へ進んだ状態
  const [attackChanceNotice, setAttackChanceNotice] = useState(false);

  const { board, attackChanceUsed } = computeAttack25Board(logs, attackChance);
  const attackChanceActive = isAttackChanceActive(board, attackChanceUsed, attackChance);
  const boardFull = board.every((cell) => cell !== null);

  // アタックチャンスの消去待ち中は、確定前の獲得を盤面に重ねて表示する
  const displayBoard: Attack25Board = pendingClaim
    ? applyReversiFlip(board, pendingClaim.panel, pendingClaim.playerId)
    : board;
  const counts = countPanels(displayBoard);

  // 選択中プレイヤーが獲得できるマス（はさめるマスがあれば必ずそれら、無ければ隣接マス）
  const claimablePanels =
    selectedPlayerId && !pendingClaim && !boardFull
      ? new Set(getClaimablePanels(board, selectedPlayerId))
      : null;

  /**
   * プレイヤーIDから並び順に応じたパネル色を返す
   *
   * @param playerId プレイヤーID
   * @returns 色名（範囲外はempty）
   */
  const colorOf = (playerId: string) => {
    const index = players.findIndex((player) => player.id === playerId);
    return index >= 0 && index < PLAYER_COLORS.length ? PLAYER_COLORS[index] : "empty";
  };

  /**
   * プレイヤーIDから表示名（未設定なら連番名）を返す
   *
   * @param playerId プレイヤーID
   * @returns 表示名
   */
  const displayNameOf = (playerId: string) => {
    const index = players.findIndex((player) => player.id === playerId);
    return players[index]?.name || `プレイヤー${index + 1}`;
  };

  /**
   * 盤面パネルクリック時の処理。通常獲得・アタックチャンスの消去を振り分ける
   *
   * @param index クリックされたパネル番号
   */
  const handlePanelClick = (index: number) => {
    if (boardFull || isPending) return;
    if (pendingClaim) {
      // 消去モード: 相手プレイヤーの点灯済みパネルのみクリックで消去
      if (
        displayBoard[index] !== null &&
        index !== pendingClaim.panel &&
        displayBoard[index] !== pendingClaim.playerId
      ) {
        onAddLog(pendingClaim.playerId, "correct", {
          panel: pendingClaim.panel,
          removedPanel: index,
        });
        setPendingClaim(null);
        setSelectedPlayerId(null);
      }
      return;
    }
    // 通常の獲得: 獲得可能なマスのみ、プレイヤー選択済みのとき
    if (board[index] !== null || !selectedPlayerId) return;
    if (claimablePanels && !claimablePanels.has(index)) return;
    if (attackChanceActive) {
      // 獲得後に相手のパネルが残るときだけ消去を促す
      const claimedBoard = applyReversiFlip(board, index, selectedPlayerId);
      const hasOpponentPanel = claimedBoard.some(
        (cell) => cell !== null && cell !== selectedPlayerId
      );
      if (hasOpponentPanel) {
        setPendingClaim({ playerId: selectedPlayerId, panel: index });
      } else {
        // 自分のパネルしかない場合は消去させず、アタックチャンスを通知して次へ
        onAddLog(selectedPlayerId, "correct", { panel: index });
        setSelectedPlayerId(null);
        setAttackChanceNotice(true);
      }
    } else {
      onAddLog(selectedPlayerId, "correct", { panel: index });
      setSelectedPlayerId(null);
    }
  };

  /** アタックチャンスで相手パネルを消さずに獲得を確定する */
  const handleSkipRemoval = () => {
    if (!pendingClaim || isPending) return;
    onAddLog(pendingClaim.playerId, "correct", { panel: pendingClaim.panel });
    setPendingClaim(null);
    setSelectedPlayerId(null);
  };

  /** 選択中プレイヤーの誤答を記録する */
  const handleWrong = () => {
    if (!selectedPlayerId || isPending) return;
    onAddLog(selectedPlayerId, "wrong");
    setSelectedPlayerId(null);
  };

  const winnerName = (() => {
    if (!boardFull) return "";
    const top = players.reduce<{ id: string; count: number }>(
      (acc, player) => {
        const count = counts[player.id] ?? 0;
        return count > acc.count ? { id: player.id, count } : acc;
      },
      { id: "", count: -1 }
    );
    return top.id ? displayNameOf(top.id) : "";
  })();

  return (
    <Flex className={classes.attack25} id="players-area" data-showheader={show_header}>
      <Box component="output" className={classes.message} aria-live="polite" aria-atomic="true">
        {boardFull ? (
          <Text className={classes.message_text} fw={700}>
            ゲーム終了 — 優勝: {winnerName}
          </Text>
        ) : pendingClaim ? (
          <>
            <Text className={classes.message_text} fw={700} c="orange">
              アタックチャンス！消すパネルを選択してください
            </Text>
            <Button size="xs" variant="default" onClick={handleSkipRemoval} disabled={isPending}>
              消さずに確定
            </Button>
          </>
        ) : !selectedPlayerId ? (
          attackChanceNotice ? (
            <Text className={classes.message_text} fw={700} c="orange">
              アタックチャンスでしたが消せる相手のパネルがありませんでした。次の正解者を選択してください
            </Text>
          ) : (
            <Text className={classes.message_text}>正解したプレイヤーを選択してください</Text>
          )
        ) : (
          <>
            <Text className={classes.message_text}>
              {players.find((player) => player.id === selectedPlayerId)?.name}
              が獲得するパネルを選択してください
              {attackChanceActive && (
                <Text component="span" c="orange" fw={700}>
                  （次の正解はアタックチャンスです）
                </Text>
              )}
            </Text>
            <Button size="xs" color="blue" onClick={handleWrong} disabled={isPending}>
              誤答
            </Button>
            <Button
              size="xs"
              variant="default"
              onClick={() => setSelectedPlayerId(null)}
              disabled={isPending}
            >
              選択解除
            </Button>
          </>
        )}
      </Box>
      <Flex className={classes.main}>
        <Flex className={classes.players}>
          {players.map((player, index) => {
            const color = colorOf(player.id);
            const isSelected = selectedPlayerId === player.id;
            const name = player.name || `プレイヤー${index + 1}`;
            return (
              <UnstyledButton
                key={player.id}
                className={classes.player_card}
                data-color={color}
                data-selected={isSelected}
                disabled={boardFull || !!pendingClaim || isPending}
                aria-pressed={isSelected}
                aria-label={`${COLOR_LABELS[color]}・${name}・${counts[player.id] ?? 0}枚保持`}
                onClick={() => {
                  setAttackChanceNotice(false);
                  setSelectedPlayerId(isSelected ? null : player.id);
                }}
              >
                <Box className={classes.player_swatch} data-color={color} aria-hidden />
                <Text className={classes.player_name}>{name}</Text>
                <Text className={classes.player_count}>{counts[player.id] ?? 0}</Text>
              </UnstyledButton>
            );
          })}
        </Flex>
        <Box className={classes.board}>
          {Array.from({ length: PANEL_COUNT }, (_, index) => {
            const cell = displayBoard[index];
            const color = cell === null ? "empty" : colorOf(cell);
            const isRemovable =
              !!pendingClaim &&
              cell !== null &&
              index !== pendingClaim.panel &&
              cell !== pendingClaim.playerId;
            const isClaimable =
              claimablePanels !== null && cell === null && claimablePanels.has(index);
            const panelLabel = (() => {
              const base = `パネル${index + 1}`;
              if (cell === null) {
                return isClaimable ? `${base}、空き、獲得できます` : `${base}、空き`;
              }
              const owner = `${COLOR_LABELS[color]}・${displayNameOf(cell)}が保持`;
              return isRemovable ? `${base}、${owner}、消去できます` : `${base}、${owner}`;
            })();
            return (
              <UnstyledButton
                key={index}
                className={classes.panel}
                data-color={color}
                data-actionable={isRemovable || isClaimable}
                disabled={boardFull || isPending || (!isRemovable && !isClaimable)}
                aria-label={panelLabel}
                onClick={() => handlePanelClick(index)}
              >
                <span className={classes.panel_number}>{index + 1}</span>
                <span className={classes.panel_owner} aria-hidden>
                  {cell === null ? "" : displayNameOf(cell)}
                </span>
              </UnstyledButton>
            );
          })}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Attack25;
