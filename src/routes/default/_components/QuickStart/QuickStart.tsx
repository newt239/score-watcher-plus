import { useRef, useState, useTransition } from "react";

import { ActionIcon, Box, Button, NativeSelect, NumberInput, Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowRight, IconMinus, IconPlus, IconSettings } from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { notifyApiError } from "@/utils/notify-error";
import { rules } from "@/utils/rules";

import { PENDING_QUICKSTART_KEY, createGameWithPlayers } from "./create-game";
import classes from "./QuickStart.module.css";

import type { RuleNames } from "@/models/game";

import type { NumberInputHandlers } from "@mantine/core";

/** 人数を変更できる上限 */
const MAX_PLAYER_COUNT = 20;

/** 人数が形式側で固定される形式のデフォルト人数 */
const FIXED_PLAYER_COUNTS: Partial<Record<RuleNames, number>> = {
  aql: 10,
};

/**
 * 形式のデフォルト数値を含む短いラベルを返す（例: 7o3x）
 *
 * @param ruleName 形式名
 * @returns セレクトに表示するラベル文字列
 */
const getRuleLabel = (ruleName: RuleNames): string => {
  switch (ruleName) {
    case "nomx":
      return `${rules.nomx.win_point}o${rules.nomx.lose_point}x`;
    case "nomx-ad":
      return `連答つき${rules["nomx-ad"].win_point}o${rules["nomx-ad"].lose_point}x`;
    case "nomr":
      return `${rules.nomr.win_point}○N休`;
    case "nbyn":
      return `${rules.nbyn.win_point}by${rules.nbyn.win_point}`;
    case "nupdown":
      return `${rules.nupdown.win_point}updown`;
    case "squarex":
      return `Square${rules.squarex.win_point}`;
    case "freezex":
      return `freeze${rules.freezex.win_point}`;
    default:
      return rules[ruleName].name;
  }
};

type QuickStartProps = {
  isLoggedIn: boolean;
};

/**
 * トップページで形式と人数を選び、最短でゲームを作成するコンポーネント
 *
 * @param isLoggedIn ログイン済みかどうか（未ログイン時はログインへ誘導する）
 * @returns クイックスタートカード
 */
const QuickStart = ({ isLoggedIn }: QuickStartProps) => {
  const navigate = useNavigate();
  const [rule, setRule] = useState<RuleNames>("nomx");
  const [players, setPlayers] = useState<number>(5);
  const [isPending, startTransition] = useTransition();
  const handlersRef = useRef<NumberInputHandlers>(null);

  const ruleNames = Object.keys(rules) as RuleNames[];
  const ruleOptions = ruleNames.map((ruleName) => ({
    value: ruleName,
    label: getRuleLabel(ruleName),
  }));

  const isPlayerCountFixed = typeof FIXED_PLAYER_COUNTS[rule] === "number";

  const applyRule = (value: string | null) => {
    const nextRule = ruleNames.find((ruleName) => ruleName === value);
    if (!nextRule) return;
    setRule(nextRule);
    const fixed = FIXED_PLAYER_COUNTS[nextRule];
    if (typeof fixed === "number") setPlayers(fixed);
  };

  const startGame = (withPlayers: boolean) => {
    if (!isLoggedIn) {
      sessionStorage.setItem(
        PENDING_QUICKSTART_KEY,
        JSON.stringify({ rule, players, withPlayers })
      );
      navigate("/sign-in");
      return;
    }

    startTransition(async () => {
      try {
        const gameId = await createGameWithPlayers(rule, players, withPlayers);
        notifications.show({
          title: "成功",
          message: "ゲームを作成しました",
          color: "green",
        });
        navigate(`/games/${gameId}/config`);
      } catch (error) {
        notifyApiError(error, "ゲームの作成に失敗しました");
      }
    });
  };

  return (
    <Box className={classes.card}>
      <Box className={classes.card_title}>得点表示を作る</Box>
      <Box className={classes.inputs}>
        <Select
          allowDeselect={false}
          className={classes.rule_select}
          data={ruleOptions}
          label="形式"
          radius="md"
          size="lg"
          value={rule}
          onChange={(value) => applyRule(value)}
        />
        <NativeSelect
          className={classes.rule_native_select}
          data={ruleOptions}
          label="形式"
          radius="md"
          size="lg"
          value={rule}
          onChange={(event) => applyRule(event.currentTarget.value)}
        />
        <NumberInput
          className={classes.player_input}
          classNames={{ input: classes.player_input_field }}
          clampBehavior="strict"
          disabled={isPlayerCountFixed}
          handlersRef={handlersRef}
          hideControls
          label="人数"
          leftSection={
            <ActionIcon
              aria-label="人数を減らす"
              disabled={isPlayerCountFixed || players <= 1}
              radius="md"
              size="lg"
              variant="subtle"
              onClick={() => handlersRef.current?.decrement()}
            >
              <IconMinus />
            </ActionIcon>
          }
          leftSectionPointerEvents="all"
          leftSectionWidth={48}
          max={MAX_PLAYER_COUNT}
          min={1}
          radius="md"
          rightSection={
            <ActionIcon
              aria-label="人数を増やす"
              disabled={isPlayerCountFixed || players >= MAX_PLAYER_COUNT}
              radius="md"
              size="lg"
              variant="subtle"
              onClick={() => handlersRef.current?.increment()}
            >
              <IconPlus />
            </ActionIcon>
          }
          rightSectionPointerEvents="all"
          rightSectionWidth={48}
          size="lg"
          value={players}
          onChange={(value) => setPlayers(typeof value === "number" ? value : 1)}
        />
      </Box>
      <Box className={classes.actions}>
        <Button
          radius="lg"
          rightSection={<IconArrowRight />}
          size="lg"
          loading={isPending}
          onClick={() => startGame(true)}
        >
          開始する
        </Button>
        <Button
          className={classes.detail_link}
          variant="subtle"
          color="gray"
          leftSection={<IconSettings size={18} />}
          disabled={isPending}
          onClick={() => startGame(false)}
        >
          細かく設定する
        </Button>
      </Box>
    </Box>
  );
};

export default QuickStart;
