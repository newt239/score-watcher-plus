import { useRef, useState, useTransition } from "react";

import { Box, Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconFileImport } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useNavigate } from "react-router";

import { LocalExportFileSchema } from "@/models/migration";
import createApiClient from "@/utils/hono/browser";
import { countNewResources } from "@/utils/migration/local-data";
import { notifyApiError } from "@/utils/notify-error";

import ImportSelectionModal from "./ImportSelectionModal";

import type { LocalExportFileType, PreviewLocalDataImportResponseType } from "@/models/migration";

type SelectionTarget = {
  data: LocalExportFileType;
  preview: PreviewLocalDataImportResponseType;
};

/** ローカル版から書き出したJSONを取り込むコンポーネント */
const ImportLocalData: React.FC = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [selectionTarget, setSelectionTarget] = useState<SelectionTarget | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const importLocalData = (data: LocalExportFileType, startLimitGrace: boolean) => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.migration.import.$post({ json: { data, startLimitGrace } })
        );

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        notifications.show({
          title: "データを取り込みました",
          message: result.message,
          autoClose: 9000,
          withCloseButton: true,
        });
        setSelectionTarget(null);
        await navigate(result.limitGraceUntil ? "/user/plan" : "/games");
      } catch (error) {
        console.error("Failed to import local data:", error);
        notifyApiError(error, "データの取り込みに失敗しました");
      }
    });
  };

  const confirmImportAll = (data: LocalExportFileType) => {
    modals.openConfirmModal({
      title: "データを取り込む",
      centered: true,
      children: (
        <Box>
          <p>
            ゲーム{data.games.length}件、プレイヤー{data.players.length}件、問題{data.quizes.length}
            件、操作ログ
            {data.logs.length}件を取り込みます。
          </p>
          <p>同じファイルを2回取り込むと、ゲームと問題が重複して登録されます。</p>
        </Box>
      ),
      labels: { confirm: "取り込む", cancel: "取り込まない" },
      onConfirm: () => importLocalData(data, false),
    });
  };

  /** 選択されたファイルを読み込み、上限に収まるかを確かめてから取り込む */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // 同じファイルを選び直せるように値を消しておく
    event.currentTarget.value = "";
    if (!file) return;

    startTransition(async () => {
      const parsed = LocalExportFileSchema.safeParse(JSON.parse(await file.text()));

      if (!parsed.success) {
        notifications.show({
          title: "読み込めませんでした",
          message: "ローカル版で書き出した移行用のファイルを選択してください",
          color: "red",
        });
        return;
      }

      try {
        const apiClient = createApiClient();
        const preview = await parseResponse(
          apiClient.migration.preview.$post({ json: { data: parsed.data } })
        );

        if ("error" in preview) {
          throw new Error(String(preview.error));
        }

        const counts = countNewResources(parsed.data, preview.matchedPlayerIds);
        const fitsLimits = (["game", "player", "quiz"] as const).every(
          (key) => preview.usage[key] + counts[key] <= preview.limits[key]
        );

        if (fitsLimits) {
          confirmImportAll(parsed.data);
        } else {
          setSelectionTarget({ data: parsed.data, preview });
        }
      } catch (error) {
        console.error("Failed to preview local data import:", error);
        notifyApiError(error, "取り込み内容の確認に失敗しました");
      }
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
      {selectionTarget && (
        <ImportSelectionModal
          data={selectionTarget.data}
          preview={selectionTarget.preview}
          isPending={isPending}
          onImport={importLocalData}
          onClose={() => setSelectionTarget(null)}
        />
      )}
    </>
  );
};

export default ImportLocalData;
