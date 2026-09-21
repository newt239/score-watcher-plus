import { useRef, useTransition } from "react";

import { Box, Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconFileImport } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useNavigate } from "react-router";

import { ImportLocalDataRequestSchema } from "@/models/migration";
import createApiClient from "@/utils/hono/browser";
import { notifyApiError } from "@/utils/notify-error";

import type { ImportLocalDataRequestType } from "@/models/migration";

/** ローカル版から書き出したJSONを取り込むコンポーネント */
const ImportLocalData: React.FC = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const importLocalData = (data: ImportLocalDataRequestType) => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(apiClient.migration.import.$post({ json: data }));

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        notifications.show({
          title: "データを取り込みました",
          message: result.message,
          autoClose: 9000,
          withCloseButton: true,
        });
        await navigate("/games");
      } catch (error) {
        console.error("Failed to import local data:", error);
        notifyApiError(error, "データの取り込みに失敗しました");
      }
    });
  };

  /** 選択されたファイルを読み込み、件数を確認してから取り込む */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // 同じファイルを選び直せるように値を消しておく
    event.currentTarget.value = "";
    if (!file) return;

    startTransition(async () => {
      const parsed = ImportLocalDataRequestSchema.safeParse(JSON.parse(await file.text()));

      if (!parsed.success) {
        notifications.show({
          title: "読み込めませんでした",
          message: "ローカル版で書き出した移行用のファイルを選択してください",
          color: "red",
        });
        return;
      }

      const { games, players, quizes, logs } = parsed.data;

      modals.openConfirmModal({
        title: "データを取り込む",
        centered: true,
        children: (
          <Box>
            <p>
              ゲーム{games.length}件、プレイヤー{players.length}件、問題{quizes.length}件、操作ログ
              {logs.length}件を取り込みます。
            </p>
            <p>同じファイルを2回取り込むと、ゲームと問題が重複して登録されます。</p>
          </Box>
        ),
        labels: { confirm: "取り込む", cancel: "取り込まない" },
        onConfirm: () => importLocalData(parsed.data),
      });
    });
  };

  return (
    <>
      <Button
        leftSection={<IconFileImport size={16} />}
        onClick={() => inputRef.current?.click()}
        loading={isPending}
        disabled={isPending}
      >
        移行用ファイルを選択
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

export default ImportLocalData;
