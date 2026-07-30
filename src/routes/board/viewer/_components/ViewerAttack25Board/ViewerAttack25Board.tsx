import { Box, Flex, Text } from "@mantine/core";

import { PANEL_COUNT } from "@/utils/online/attack25";

import classes from "./ViewerAttack25Board.module.css";

import type { ViewerPlayerType } from "@/models/game";

/** プレイヤーの並び順に対応するパネルの色 */
const PLAYER_COLORS = ["red", "green", "white", "blue"] as const;

type ViewerAttack25BoardProps = {
  players: ViewerPlayerType[];
  board: (string | null)[];
};

/**
 * アタック25の盤面を観戦用に読み取り専用で描画するコンポーネント
 *
 * @param players スコア計算済みのプレイヤー一覧
 * @param board 各パネルの保持プレイヤーID（空きはnull）
 * @returns アタック25の観戦用盤面
 */
const ViewerAttack25Board = ({ players, board }: ViewerAttack25BoardProps) => {
  /**
   * プレイヤーIDから並び順に応じたパネル色を返す
   *
   * @param playerId プレイヤーID
   * @returns 色名（範囲外はempty）
   */
  const colorOf = (playerId: string | null) => {
    if (playerId === null) return "empty";
    const index = players.findIndex((player) => player.player_id === playerId);
    return index >= 0 && index < PLAYER_COLORS.length ? PLAYER_COLORS[index] : "empty";
  };

  return (
    <Flex className={classes.attack25}>
      <Flex className={classes.players}>
        {players.map((player) => (
          <Box
            key={player.player_id}
            className={classes.player_card}
            data-color={colorOf(player.player_id)}
          >
            <Box className={classes.player_swatch} data-color={colorOf(player.player_id)} />
            <Text className={classes.player_name}>{player.name}</Text>
            <Text className={classes.player_count}>{player.score}</Text>
          </Box>
        ))}
      </Flex>
      <Box className={classes.board}>
        {Array.from({ length: PANEL_COUNT }, (_, index) => (
          <Box key={index} className={classes.panel} data-color={colorOf(board[index] ?? null)}>
            {index + 1}
          </Box>
        ))}
      </Box>
    </Flex>
  );
};

export default ViewerAttack25Board;
