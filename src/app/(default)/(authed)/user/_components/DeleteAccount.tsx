"use client";

import { useState, useTransition } from "react";

import { Box, Button, Divider, Text, TextInput, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useRouter } from "next/navigation";

import { authClient } from "@/utils/auth/auth-client";
import createApiClient from "@/utils/hono/browser";

type DeleteAccountProps = {
  userId: string;
  email: string;
};

/** アカウントと保存データをすべて削除するコンポーネント */
const DeleteAccount: React.FC<DeleteAccountProps> = ({ userId, email }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const deleteAccount = () => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.user[":user_id"].$delete({
            param: { user_id: userId },
          })
        );

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        await authClient.signOut();
        notifications.show({
          title: "アカウントを削除しました",
          message: "ご利用ありがとうございました。",
          autoClose: 9000,
          withCloseButton: true,
        });
        router.push("/");
      } catch (error) {
        console.error("Failed to delete account:", error);
        notifications.show({
          title: "エラーが発生しました",
          message: "アカウントの削除に失敗しました",
          color: "red",
          autoClose: 9000,
          withCloseButton: true,
        });
      }
    });
  };

  const showDeleteConfirm = () => {
    modals.openConfirmModal({
      title: "アカウントを削除",
      centered: true,
      children: (
        <Box>
          <p>アカウントと、保存されているゲーム・プレイヤー・問題のデータをすべて削除します。</p>
          <p>この操作は取り消せません。</p>
        </Box>
      ),
      labels: { confirm: "削除する", cancel: "削除しない" },
      confirmProps: { color: "red" },
      onConfirm: deleteAccount,
    });
  };

  return (
    <Box mt="xl">
      <Divider mb="md" />
      <Title order={3} mb="md">
        アカウントの削除
      </Title>
      <Text size="sm" c="dimmed" mb="md">
        アカウントを削除すると、保存されているゲーム・プレイヤー・問題のデータもすべて削除されます。
        削除する場合は確認のためメールアドレス（{email}）を入力してください。
      </Text>
      <TextInput
        label="メールアドレス"
        placeholder={email}
        value={confirmText}
        onChange={(event) => setConfirmText(event.currentTarget.value)}
        disabled={isPending}
        maw={400}
      />
      <Button
        mt="sm"
        color="red"
        leftSection={<IconTrash />}
        onClick={showDeleteConfirm}
        disabled={isPending || confirmText !== email}
      >
        アカウントを削除する
      </Button>
    </Box>
  );
};

export default DeleteAccount;
