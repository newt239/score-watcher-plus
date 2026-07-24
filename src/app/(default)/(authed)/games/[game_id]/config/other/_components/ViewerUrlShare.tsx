"use client";

import { ActionIcon, CopyButton, Group, Text, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy, IconExternalLink } from "@tabler/icons-react";

import ButtonLink from "@/components/ButtonLink";

type ViewerUrlShareProps = {
  viewerUrl: string;
};

/** 観戦ページのURLを表示してコピー・遷移できるようにするコンポーネント */
const ViewerUrlShare: React.FC<ViewerUrlShareProps> = ({ viewerUrl }) => {
  return (
    <>
      <Text size="sm" fw={500} mt="md">
        観戦用URL
      </Text>
      <Text size="xs" c="dimmed" mb="xs">
        このURLを共有すると、ログインしていない人でも得点状況を見られます。
      </Text>
      <Group gap="xs" align="flex-end">
        <TextInput readOnly value={viewerUrl} flex={1} aria-label="観戦用URL" />
        <CopyButton value={viewerUrl} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "コピーしました" : "URLをコピー"} withArrow>
              <ActionIcon
                variant="default"
                size="lg"
                color={copied ? "teal" : "gray"}
                onClick={copy}
                aria-label="観戦用URLをコピー"
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <ButtonLink href={viewerUrl} variant="default" leftSection={<IconExternalLink size={18} />}>
          開く
        </ButtonLink>
      </Group>
    </>
  );
};

export default ViewerUrlShare;
