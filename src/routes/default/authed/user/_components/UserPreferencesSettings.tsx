import { useState, useTransition } from "react";

import { Flex, Switch, Title, useMantineColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { parseResponse } from "hono/client";

import { type UserPreferencesType } from "@/models/user-preference";
import createApiClient from "@/utils/hono/browser";

type Props = {
  initialPreferences: UserPreferencesType;
  userId: string;
};

const UserPreferencesSettings: React.FC<Props> = ({ initialPreferences, userId }) => {
  const [preferences, setPreferences] = useState<UserPreferencesType>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const { setColorScheme } = useMantineColorScheme();

  const handleUpdate = <K extends keyof UserPreferencesType>(
    key: K,
    value: UserPreferencesType[K]
  ) => {
    setPreferences((prev: UserPreferencesType) => ({ ...prev, [key]: value }));

    startTransition(async () => {
      try {
        const apiClient = await createApiClient();
        const result = await parseResponse(
          apiClient.user[":user_id"].preferences.$patch({
            param: { user_id: userId },
            json: { [key]: value },
          })
        );

        if (!("success" in result) || !result.success) {
          throw new Error("API returned error status");
        }

        notifications.show({
          title: "設定を保存しました",
          message: "設定が正常に保存されました。",
          color: "green",
        });
      } catch (error) {
        console.error(error);
        notifications.show({
          title: "エラー",
          message: "設定の保存に失敗しました。",
          color: "red",
        });
        // エラー時は設定を元に戻す
        setPreferences((prev: UserPreferencesType) => ({
          ...prev,
          [key]: initialPreferences[key],
        }));
      }
    });
  };

  return (
    <Flex direction="column" mt="xl">
      <Title order={3} mb="md">
        表示設定
      </Title>

      <Flex direction="column" gap="md" mb="xl">
        <Switch
          checked={preferences.theme === "dark"}
          onChange={(event) => {
            const newTheme = event.currentTarget.checked ? "dark" : "light";
            // 画面へ即座に反映させる
            setColorScheme(newTheme);
            handleUpdate("theme", newTheme);
          }}
          label="ダークモード"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.showWinthroughPopup}
          onChange={(event) => {
            handleUpdate("showWinthroughPopup", event.currentTarget.checked);
          }}
          label="勝ち抜け時にポップアップを表示"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.showBoardHeader}
          onChange={(event) => {
            handleUpdate("showBoardHeader", event.currentTarget.checked);
          }}
          label="ヘッダーを表示"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.showQn}
          onChange={(event) => {
            handleUpdate("showQn", event.currentTarget.checked);
          }}
          label="ヘッダーに問題番号を表示"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.showSignString}
          onChange={(event) => {
            handleUpdate("showSignString", event.currentTarget.checked);
          }}
          label="スコアに「○」「✕」「pt」の文字列を付与する"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.reversePlayerInfo}
          onChange={(event) => {
            handleUpdate("reversePlayerInfo", event.currentTarget.checked);
          }}
          label="スコアを名前の上に表示"
          size="md"
          disabled={isPending}
        />

        <Switch
          checked={preferences.wrongNumber}
          onChange={(event) => {
            handleUpdate("wrongNumber", event.currentTarget.checked);
          }}
          label="誤答数が4以下のとき✕の数で表示"
          description="誤答数が0のときは中黒・で表示されます。"
          size="md"
          disabled={isPending}
        />
      </Flex>
    </Flex>
  );
};

export default UserPreferencesSettings;
