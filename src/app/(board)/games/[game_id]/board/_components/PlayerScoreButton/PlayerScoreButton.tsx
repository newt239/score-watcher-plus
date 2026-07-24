"use client";

import React from "react";

import { TextInput, UnstyledButton, useComputedColorScheme } from "@mantine/core";

import classes from "./PlayerScoreButton.module.css";

import type { LogDBProps } from "@/models/game";

type PlayerScoreButtonProps = {
  color: "red" | "blue" | "green" | "gray" | "black" | "win" | "lose" | "playing";
  filled?: boolean;
  compact?: boolean;
  playerId: string;
  isPending: boolean;
  onAddLog: (playerId: string, actionType: LogDBProps["variant"]) => void;
  disabled?: boolean;
  /** スコアの手動更新モードが有効かどうか */
  editable?: boolean;
  /** 既定の動作の代わりに実行する処理 */
  onClick?: () => void;
  children: string;
};

const PlayerScoreButton: React.FC<PlayerScoreButtonProps> = ({
  color,
  children,
  filled = false,
  compact = false,
  playerId,
  isPending,
  onAddLog,
  disabled,
  editable = false,
  onClick,
}) => {
  const numberSign = children.endsWith("pt")
    ? "pt"
    : children.endsWith("○")
      ? "correct"
      : children.endsWith("✕")
        ? "wrong"
        : "none";
  const computedColorScheme = useComputedColorScheme("light");

  const defaultColor = computedColorScheme === "light" ? "white" : "gray.8";
  const variantColor =
    color === "gray"
      ? "gray.3"
      : color === "black"
        ? "gray.9"
        : ["red", "win"].includes(color)
          ? computedColorScheme === "light"
            ? "red.9"
            : "red.3"
          : ["blue", "lose"].includes(color)
            ? computedColorScheme === "light"
              ? "blue.9"
              : "blue.3"
            : computedColorScheme === "light"
              ? "green.9"
              : "yellow.3";

  const handleClick = () => {
    if (color === "green" || disabled || isPending) return;

    if (onClick) {
      onClick();
      return;
    }

    onAddLog(playerId, color === "red" ? "correct" : "wrong");
  };

  // 手動更新モードでは表示されている値を自由に書き換えられるようにする（ログには記録されない）
  if (editable) {
    return (
      <TextInput
        variant="unstyled"
        classNames={{ input: classes.player_score_button }}
        data-compact={compact}
        styles={{
          input: {
            cursor: "text",
            color: `var(--mantine-color-${(filled ? defaultColor : variantColor).replace(".", "-")})`,
            backgroundColor: filled ? variantColor : "transparent",
          },
        }}
        defaultValue={children}
      />
    );
  }

  return (
    <UnstyledButton
      onClick={handleClick}
      className={classes.player_score_button}
      data-signed={numberSign !== "none"}
      data-compact={compact}
      data-disabled={disabled || isPending}
      style={{
        cursor:
          disabled && color !== "green"
            ? "not-allowed"
            : disabled || color === "green" || isPending
              ? "default"
              : "pointer",
      }}
      c={filled ? defaultColor : variantColor}
      bg={filled ? variantColor : "transparent"}
    >
      {numberSign === "none" ? (
        <span>{children}</span>
      ) : (
        <>
          <span>{children.split(/((?:○)|(?:✕)|(?:pt))/)[0]}</span>
          <span style={{ fontSize: "50%" }}>{children.split(/((?:○)|(?:✕)|(?:pt))/)[1]}</span>
        </>
      )}
    </UnstyledButton>
  );
};

export default PlayerScoreButton;
