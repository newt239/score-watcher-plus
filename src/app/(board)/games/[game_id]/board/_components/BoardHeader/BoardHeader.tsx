"use client";

import { useEffect, useState } from "react";

import { ActionIcon, Box, Button, Flex, Menu, MenuDivider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconBalloon,
  IconComet,
  IconMaximize,
  IconSettings,
  IconSquare,
  IconSquareCheck,
} from "@tabler/icons-react";

import Link from "@/components/Link";
import { rules } from "@/utils/rules";

import PreferenceDrawer from "../PreferenceDrawer/PreferenceDrawer";
import classes from "./BoardHeader.module.css";

import type { BoardQuizType, RuleNames } from "@/models/game";
import type { UserPreferencesType } from "@/models/user-preference";

type OnlineGame = {
  id: string;
  name: string;
  ruleType: RuleNames;
  win_point?: number; // nbyn形式で使用
};

type BoardHeaderProps = {
  game: OnlineGame;
  logsLength: number;
  /** 画面に表示する問題番号（0始まり） */
  questionNumber: number;
  /** 現在表示する問題文の位置（0始まり。問題未開始や範囲外の場合は負値） */
  quizPosition: number;
  quizList: BoardQuizType[];
  onUndo: () => void;
  onThrough: () => void;
  preferences: UserPreferencesType | null;
  userId: string;
  /** スコアの手動更新モードが有効かどうか */
  editable: boolean;
  onToggleEditable: () => void;
};

const BoardHeader: React.FC<BoardHeaderProps> = ({
  game,
  logsLength,
  questionNumber,
  quizPosition,
  quizList,
  onUndo,
  onThrough,
  preferences,
  userId,
  editable,
  onToggleEditable,
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  // 手動更新モードで問題番号を前後させるためのずれ幅
  const [manualQuizShift, setManualQuizShift] = useState(0);

  // API経由で設定を取得（デフォルト値を設定）
  const showBoardHeader = preferences?.showBoardHeader ?? true;
  const showQn = preferences?.showQn ?? false;

  useEffect(() => {
    // クライアントサイドでのみフルスクリーン機能の有効性をチェック
    setIsFullscreenEnabled(typeof document !== "undefined" && document.fullscreenEnabled);
  }, []);

  // 手動更新モードを抜けたら問題番号のずれをリセットする
  useEffect(() => {
    setManualQuizShift(0);
  }, [editable]);

  // オンライン版用のルール名表示関数
  const getRuleDisplayName = (ruleType: RuleNames): string => {
    return rules[ruleType].name;
  };

  if (!showBoardHeader) return null;

  const displayedQuestionNumber = questionNumber + 1 + manualQuizShift;
  const displayedQuizPosition = quizPosition + manualQuizShift;

  return (
    <>
      <Flex
        component="header"
        className={classes.board_header}
        data-withname={!(game.name === rules[game.ruleType].name || game.name === "")}
        data-showquiz={quizList.length > 0}
        data-showqn={showQn}
      >
        {
          // ゲーム名なしの場合
          game.name === rules[game.ruleType].name || game.name === "" ? (
            <div className={classes.game_name_only} data-showqn={showQn}>
              <span>Q{displayedQuestionNumber}</span>
              <span>{getRuleDisplayName(game.ruleType)}</span>
            </div>
          ) : (
            <Flex className={classes.game_info_wrapper}>
              <Flex className={classes.game_info_area} data-showqn={showQn}>
                <div className={classes.game_name}>{game.name}</div>
                <div>{getRuleDisplayName(game.ruleType)}</div>
              </Flex>
              {showQn && (
                <Flex className={classes.quiz_number_area}>
                  <Box className={classes.quiz_number}>Q{displayedQuestionNumber}</Box>
                  {editable && (
                    <Button.Group variant="outline">
                      <Button
                        h="auto"
                        disabled={displayedQuestionNumber <= 1}
                        onClick={() => setManualQuizShift((v) => v - 1)}
                      >
                        {"<"}
                      </Button>
                      <Button h="auto" onClick={() => setManualQuizShift((v) => v + 1)}>
                        {">"}
                      </Button>
                    </Button.Group>
                  )}
                </Flex>
              )}
            </Flex>
          )
        }
        {quizList.length > 0 && (
          <Box className={classes.quiz_area}>
            <span>
              {displayedQuizPosition < 0 || displayedQuizPosition >= quizList.length
                ? "ここに問題文が表示されます"
                : quizList[displayedQuizPosition].question}
            </span>
            <span className={classes.answer}>
              {displayedQuizPosition < 0 || displayedQuizPosition >= quizList.length
                ? "ここに答えが表示されます"
                : quizList[displayedQuizPosition].answer}
            </span>
          </Box>
        )}
        <Menu>
          <Menu.Target>
            <ActionIcon
              className={classes.board_action}
              variant="default"
              size="xl"
              color="teal"
              m="xs"
            >
              <IconSettings />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              closeMenuOnClick={false}
              leftSection={<IconComet />}
              disabled={editable}
              onClick={onThrough}
            >
              スルー
            </Menu.Item>
            <Menu.Item
              closeMenuOnClick={false}
              leftSection={<IconArrowBackUp />}
              disabled={logsLength === 0 || editable}
              onClick={onUndo}
            >
              一つ戻す
            </Menu.Item>
            {game.ruleType !== "aql" && (
              <Menu.Item
                closeMenuOnClick={false}
                leftSection={editable ? <IconSquareCheck /> : <IconSquare />}
                onClick={onToggleEditable}
              >
                スコアの手動更新
              </Menu.Item>
            )}
            {isFullscreenEnabled && (
              <Menu.Item
                leftSection={<IconMaximize />}
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen();
                  }
                }}
              >
                フルスクリーン
              </Menu.Item>
            )}
            <Menu.Item leftSection={<IconBalloon />} onClick={open}>
              表示設定
            </Menu.Item>
            <MenuDivider />
            <Menu.Item
              component={Link}
              leftSection={<IconAdjustmentsHorizontal />}
              href={`/games/${game.id}/config`}
            >
              ゲーム設定
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Flex>
      <PreferenceDrawer
        isOpen={opened}
        onClose={close}
        userId={userId}
        initialPreferences={preferences}
      />
    </>
  );
};

export default BoardHeader;
