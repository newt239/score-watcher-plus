import { Flex } from "@mantine/core";

import Player from "../Player/Player";
import classes from "./Players.module.css";

import type { ComputedScoreProps, GamePlayerProps, LogDBProps, RuleNames } from "@/models/game";
import type { UserPreferencesType } from "@/models/user-preference";

type OnlineGame = {
  id: string;
  name: string;
  ruleType: RuleNames;
  win_point?: number; // nbyn形式で使用
};

type PlayersProps = {
  game: OnlineGame;
  scores: ComputedScoreProps[];
  players: GamePlayerProps[];
  isPending: boolean;
  onAddLog: (playerId: string, actionType: LogDBProps["variant"]) => void;
  preferences: UserPreferencesType | null;
  /** ヘッダーに問題文を表示しているかどうか */
  showQuiz: boolean;
  /** スコアの手動更新モードが有効かどうか */
  editable: boolean;
  /** エンドレスチャンスで誤答を切り替える */
  onToggleMultipleWrong: (playerId: string) => void;
};

/** オンライン版のプレイヤー一覧表示コンポーネント ローカル版のPlayersコンポーネントと同等の機能を提供 */
const Players: React.FC<PlayersProps> = ({
  game,
  scores,
  players,
  isPending,
  onAddLog,
  preferences,
  showQuiz,
  editable,
  onToggleMultipleWrong,
}) => {
  return (
    <Flex
      className={classes.players}
      id="players-area"
      data-showq={showQuiz}
      data-showheader={preferences?.showBoardHeader ?? true}
    >
      {players.map((player, i) => (
        <Player
          game={game}
          index={i}
          key={`online-player-${i}-${player.id}`}
          player={player}
          score={scores.find((score) => score.player_id === player.id)}
          isPending={isPending}
          onAddLog={onAddLog}
          preferences={preferences}
          totalPlayers={players.length}
          editable={editable}
          onToggleMultipleWrong={onToggleMultipleWrong}
        />
      ))}
    </Flex>
  );
};

export default Players;
