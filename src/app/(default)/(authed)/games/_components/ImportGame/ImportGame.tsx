"use client";

import { useRef, useTransition } from "react";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconFileImport } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useRouter } from "next/navigation";

import { ImportGameRequestSchema } from "@/models/game";
import createApiClient from "@/utils/hono/browser";

/** エクスポートしたJSONファイルからゲームを復元するコンポーネント */
const ImportGame: React.FC = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  /** 選択されたファイルを読み込んでインポートする */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // 同じファイルを選び直せるように値を消しておく
    event.currentTarget.value = "";
    if (!file) return;

    startTransition(async () => {
      try {
        const parsed = ImportGameRequestSchema.safeParse(JSON.parse(await file.text()));

        if (!parsed.success) {
          notifications.show({
            title: "読み込めませんでした",
            message: "Score Watcherでエクスポートしたゲームのファイルを選択してください",
            color: "red",
          });
          return;
        }

        const apiClient = createApiClient();
        const result = await parseResponse(apiClient.games.import.$post({ json: parsed.data }));

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        notifications.show({
          title: "ゲームをインポートしました",
          message: result.message,
          autoClose: 9000,
          withCloseButton: true,
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to import game:", error);
        notifications.show({
          title: "エラーが発生しました",
          message: "ゲームのインポートに失敗しました",
          color: "red",
        });
      }
    });
  };

  return (
    <>
      <Button
        variant="default"
        leftSection={<IconFileImport size={16} />}
        onClick={() => inputRef.current?.click()}
        loading={isPending}
      >
        ゲームをインポート
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={handleFileChange}
      />
    </>
  );
};

export default ImportGame;
