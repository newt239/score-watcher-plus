import { useState } from "react";

import { Box, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";

import ButtonLink from "@/components/ButtonLink";

const ViewerNotFound = () => {
  const [gameId, setGameId] = useState("");

  return (
    <Box component="main" maw={600} mx="auto" mt="xl" p="md">
      <Stack gap="md">
        <Title order={2}>ゲームが見つかりませんでした</Title>
        <Text>
          お探しのゲームは存在しないか、非公開に設定されています。ゲームIDを確認して入力し直してください。
        </Text>
        <Group gap="sm" align="flex-end">
          <TextInput
            label="ゲームID"
            value={gameId}
            onChange={(e) => setGameId(e.currentTarget.value)}
            flex={1}
          />
          <ButtonLink href={`/viewer/${gameId.trim()}`} disabled={gameId.trim() === ""}>
            観戦する
          </ButtonLink>
        </Group>
        <ButtonLink href="/" variant="default" leftSection={<IconHome size={16} />}>
          トップページへ戻る
        </ButtonLink>
      </Stack>
    </Box>
  );
};

export default ViewerNotFound;
