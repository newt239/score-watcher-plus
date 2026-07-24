"use client";

import { useTransition } from "react";

import { Box, Button, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconRefresh } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useRouter } from "next/navigation";

import createApiClient from "@/utils/hono/browser";

type ResetGameProps = {
  gameId: string;
  gameName: string;
  logCount: number;
};

/** ゲームのプレイログをすべて削除して最初からやり直せるようにするコンポーネント */
const ResetGame: React.FC<ResetGameProps> = ({ gameId, gameName, logCount }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const resetGame = () => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.games[":gameId"].logs.$delete({
            param: { gameId },
          })
        );

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        notifications.show({
          title: "ゲームをリセットしました",
          message: result.message,
          autoClose: 9000,
          withCloseButton: true,
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to reset game:", error);
        notifications.show({
          title: "エラーが発生しました",
          message: "ゲームのリセットに失敗しました",
          color: "red",
          autoClose: 9000,
          withCloseButton: true,
        });
      }
    });
  };

  const showResetConfirm = () => {
    modals.openConfirmModal({
      title: "ゲームをリセット",
      centered: true,
      children: (
        <Box>
          <p>ゲーム「{gameName}」のプレイログをすべて削除して、1問目からやり直せる状態にします。</p>
          <p>プレイヤーや形式の設定は削除されません。この操作は取り消せません。</p>
        </Box>
      ),
      labels: { confirm: "リセットする", cancel: "リセットしない" },
      confirmProps: { color: "red" },
      onConfirm: resetGame,
    });
  };

  return (
    <Box mt="sm">
      <Title order={4}>ゲームをリセット</Title>
      <Text size="sm" c="dimmed" mt={4}>
        現在{logCount}件のプレイログが記録されています。
      </Text>
      <Button
        mt="sm"
        color="red"
        variant="outline"
        leftSection={<IconRefresh />}
        onClick={showResetConfirm}
        disabled={isPending || logCount === 0}
      >
        リセットする
      </Button>
    </Box>
  );
};

export default ResetGame;
