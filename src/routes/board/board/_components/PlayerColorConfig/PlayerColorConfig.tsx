import type { Dispatch, SetStateAction } from "react";

import { ActionIcon, Popover, Radio, Text, useComputedColorScheme } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";

import type { States } from "@/models/game";

type PlayerColorConfigProps = {
  colorState: string | undefined;
  editableState: States;
  setEditableState: Dispatch<SetStateAction<States>>;
};

/** 手動更新モードでプレイヤーの背景色（状態）を上書きするコンポーネント */
const PlayerColorConfig: React.FC<PlayerColorConfigProps> = ({
  colorState,
  editableState,
  setEditableState,
}) => {
  const colorScheme = useComputedColorScheme("light");

  /** ラジオボタンで選択された値を状態として反映する */
  const handleChange = (value: string) => {
    if (value === "win" || value === "lose" || value === "playing") {
      setEditableState(value);
    }
  };

  return (
    <Popover width={200} withArrow shadow="md">
      <Popover.Target>
        <ActionIcon
          aria-label="プレイヤーの状態を上書きします"
          color={colorState && (colorScheme === "light" ? "white" : "gray.8")}
          variant="subtle"
        >
          <IconEdit />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown
        style={{
          color: colorScheme === "light" ? "black" : "white",
          backgroundColor: colorScheme === "light" ? "white" : "gray.8",
        }}
      >
        <Text fw={700} mb="xs">
          背景色を変更
        </Text>
        <Radio.Group onChange={handleChange} value={editableState}>
          <Radio value="playing" label="デフォルト" />
          <Radio value="win" label="赤" />
          <Radio value="lose" label="青" />
        </Radio.Group>
      </Popover.Dropdown>
    </Popover>
  );
};

export default PlayerColorConfig;
