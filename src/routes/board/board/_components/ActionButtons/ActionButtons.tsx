import { useEffect, useState } from "react";

import { Button, Group, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconBalloon,
  IconComet,
  IconMaximize,
  IconSquare,
  IconSquareCheck,
} from "@tabler/icons-react";

import ButtonLink from "@/components/ButtonLink";

import PreferenceDrawer from "../PreferenceDrawer/PreferenceDrawer";
import classes from "./ActionButtons.module.css";

import type { RuleNames } from "@/models/game";
import type { UserPreferencesType } from "@/models/user-preference";

type ActionButtonsProps = {
  game: { id: string; name: string; ruleType: RuleNames };
  logsLength: number;
  onUndo: () => void;
  onThrough: () => void;
  userId: string;
  preferences: UserPreferencesType | null;
  /** スコアの手動更新モードが有効かどうか */
  editable: boolean;
  onToggleEditable: () => void;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({
  game,
  logsLength,
  onUndo,
  onThrough,
  userId,
  preferences,
  editable,
  onToggleEditable,
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみフルスクリーン機能の有効性をチェック
    setIsFullscreenEnabled(typeof document !== "undefined" && document.fullscreenEnabled);
  }, []);

  return (
    <>
      <ScrollArea w="100%">
        <Group justify="flex-end" p="xs" gap="xs" className={classes.action_button_list}>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconComet size={20} />}
            disabled={editable}
            onClick={onThrough}
          >
            スルー
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconArrowBackUp size={20} />}
            disabled={logsLength === 0 || editable}
            onClick={onUndo}
          >
            一つ戻す
          </Button>
          {game.ruleType !== "aql" && (
            <Button
              visibleFrom="md"
              size="xs"
              variant="default"
              leftSection={editable ? <IconSquareCheck size={20} /> : <IconSquare size={20} />}
              onClick={onToggleEditable}
            >
              スコアの手動更新
            </Button>
          )}
          {isFullscreenEnabled && (
            <Button
              visibleFrom="md"
              size="xs"
              variant="default"
              leftSection={<IconMaximize size={20} />}
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
            >
              フルスクリーン
            </Button>
          )}
          <Button
            size="xs"
            variant="default"
            leftSection={<IconBalloon size={20} />}
            onClick={open}
          >
            表示設定
          </Button>
          <ButtonLink
            size="xs"
            variant="default"
            leftSection={<IconAdjustmentsHorizontal size={20} />}
            href={`/games/${game.id}/config`}
          >
            ゲーム設定
          </ButtonLink>
        </Group>
      </ScrollArea>
      <PreferenceDrawer
        isOpen={opened}
        onClose={close}
        userId={userId}
        initialPreferences={preferences}
      />
    </>
  );
};

export default ActionButtons;
