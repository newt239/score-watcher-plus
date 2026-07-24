"use client";

import { useEffect, useState } from "react";

import { Flex, useComputedColorScheme } from "@mantine/core";

import { rules } from "@/utils/rules";

import PlayerColorConfig from "../PlayerColorConfig/PlayerColorConfig";
import PlayerHeader from "../PlayerHeader/PlayerHeader";
import PlayerName from "../PlayerName/PlayerName";
import PlayerScore from "../PlayerScore/PlayerScore";
import classes from "./Player.module.css";

import type {
  ComputedScoreProps,
  GamePlayerProps,
  LogDBProps,
  RuleNames,
  States,
} from "@/models/game";
import type { UserPreferencesType } from "@/models/user-preference";

type OnlineGame = {
  id: string;
  name: string;
  ruleType: RuleNames;
  win_point?: number; // nbyn形式で使用
};

type Props = {
  game: OnlineGame;
  player: GamePlayerProps;
  index: number;
  score: ComputedScoreProps | undefined;
  isPending: boolean;
  onAddLog: (playerId: string, actionType: LogDBProps["variant"]) => void;
  preferences: UserPreferencesType | null;
  totalPlayers: number;
  /** スコアの手動更新モードが有効かどうか */
  editable: boolean;
  /** エンドレスチャンスで誤答を切り替える */
  onToggleMultipleWrong: (playerId: string) => void;
};

const Player: React.FC<Props> = ({
  game,
  player,
  index,
  score,
  isPending,
  onAddLog,
  preferences,
  totalPlayers,
  editable,
  onToggleMultipleWrong,
}) => {
  const computedColorScheme = useComputedColorScheme("light");
  const [editableState, setEditableState] = useState<States>("playing");

  const reversePlayerInfo = preferences?.reversePlayerInfo ?? false;

  // 手動更新モードに入った時点の状態を初期値として扱う
  useEffect(() => {
    if (score) {
      setEditableState(score.state);
    }
  }, [score]);

  if (!score) return null;

  const rows = rules[game.ruleType].rows;

  // 手動更新モードでは画面上で上書きされた状態を優先して表示する
  const displayedScore: ComputedScoreProps = {
    ...score,
    state: editable ? editableState : score.state,
  };

  const getColor = (state: States) => {
    return state === "win"
      ? computedColorScheme === "light"
        ? "red.9"
        : "red.3"
      : state == "lose"
        ? computedColorScheme === "light"
          ? "blue.9"
          : "blue.3"
        : undefined;
  };

  return (
    <Flex
      className={classes.player}
      bg={getColor(displayedScore.state)}
      c={getColor(displayedScore.state) && (computedColorScheme === "light" ? "white" : "black")}
      w={{
        base: "100%",
        md: `clamp(8vw, ${(98 - totalPlayers) / totalPlayers}vw, 15vw)`,
      }}
      style={{
        borderColor: `var(--mantine-color-${(
          getColor(displayedScore.state) ||
          getColor(displayedScore.reach_state) ||
          (computedColorScheme === "dark" ? "gray.8" : "gray.1")
        ).replace(".", "-")})`,
      }}
      data-reverse={reversePlayerInfo}
    >
      <Flex className={classes.player_info} data-rows={rows}>
        {editable ? (
          <PlayerColorConfig
            colorState={getColor(displayedScore.state)}
            editableState={editableState}
            setEditableState={setEditableState}
          />
        ) : (
          <PlayerHeader
            belong={player.affiliation || ""}
            index={index}
            isVerticalView={true}
            text={player.description || ""}
          />
        )}
        <PlayerName player_name={player.name} rows={rows} />
      </Flex>
      <PlayerScore
        game={game}
        player={displayedScore}
        isPending={isPending}
        onAddLog={onAddLog}
        preferences={preferences}
        editable={editable}
        baseCorrectPoint={player.baseCorrectPoint}
        onToggleMultipleWrong={onToggleMultipleWrong}
      />
    </Flex>
  );
};

export default Player;
