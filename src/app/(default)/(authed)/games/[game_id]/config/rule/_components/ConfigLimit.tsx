"use client";

import { useState, useTransition } from "react";

import { Flex, NumberInput, Switch } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { parseResponse } from "hono/client";
import { useRouter } from "next/navigation";

import createApiClient from "@/utils/hono/browser";

import classes from "./ConfigLimit.module.css";

type ConfigLimitProps = {
  gameId: string;
  /** 現在の限定問題数（未設定の場合はundefined） */
  limit: number | undefined;
  /** 現在の勝ち抜け人数（未設定の場合はundefined） */
  winThrough: number | undefined;
  /** 勝ち抜け人数を形式側で使用しているか（attacksurvivalでは形式設定側で指定する） */
  hasOwnWinThrough: boolean;
};

/** 限定問題数と勝ち抜け人数を設定するコンポーネント */
const ConfigLimit: React.FC<ConfigLimitProps> = ({
  gameId,
  limit,
  winThrough,
  hasOwnWinThrough,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ limit, winThrough });

  /** オプションを1件更新する */
  const updateOption = (key: "limit" | "win_through", value: number) => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.games[":gameId"].options.$patch({
            param: { gameId },
            json: { key, value },
          })
        );
        if (!result.updated) {
          throw new Error(result.message);
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to update limit setting:", error);
        notifications.show({
          title: "エラー",
          message: "設定の保存に失敗しました",
          color: "red",
        });
      }
    });
  };

  /** 限定問題数の有効・無効を切り替える */
  const handleToggle = (checked: boolean) => {
    // 無効化は0を保存して「未設定」として扱う
    const nextLimit = checked ? 10 : 0;
    const nextWinThrough = checked ? 3 : 0;

    setValues({
      limit: checked ? nextLimit : undefined,
      winThrough: hasOwnWinThrough ? values.winThrough : checked ? nextWinThrough : undefined,
    });

    updateOption("limit", nextLimit);
    if (!hasOwnWinThrough) {
      updateOption("win_through", nextWinThrough);
    }
  };

  const enabled = typeof values.limit === "number" && values.limit > 0;

  return (
    <Flex className={classes.config_limit}>
      <Switch
        checked={enabled}
        onChange={(event) => handleToggle(event.currentTarget.checked)}
        label="限定問題数を設定する"
        description="指定した問題数に到達した時点で、順位に応じて勝ち抜け・敗退を判定します。"
        size="md"
        disabled={isPending}
      />
      <Flex className={classes.config_limit_inputs}>
        <NumberInput
          disabled={!enabled || isPending}
          label="限定問題数"
          max={100}
          min={1}
          value={values.limit ?? ""}
          onChange={(n) => {
            const nextValue = typeof n === "number" ? n : 0;
            setValues((prev) => ({ ...prev, limit: nextValue }));
            updateOption("limit", nextValue);
          }}
          size="md"
        />
        {!hasOwnWinThrough && (
          <NumberInput
            disabled={!enabled || isPending}
            label="勝ち抜け人数"
            max={100}
            min={1}
            value={values.winThrough ?? ""}
            onChange={(n) => {
              const nextValue = typeof n === "number" ? n : 0;
              setValues((prev) => ({ ...prev, winThrough: nextValue }));
              updateOption("win_through", nextValue);
            }}
            size="md"
          />
        )}
      </Flex>
    </Flex>
  );
};

export default ConfigLimit;
