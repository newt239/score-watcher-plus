import { Stack, Text, Title } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { data } from "react-router";

import ButtonLink from "@/components/ButtonLink";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "ページが見つかりません - Score Watcher" },
  { name: "robots", content: "noindex" },
];

export const loader = () => data(null, { status: 404 });

const NotFoundPage = () => {
  return (
    <Stack align="center" mt="xl" gap="md">
      <Title order={2}>ページが見つかりません</Title>
      <Text>お探しのページは移動または削除された可能性があります。</Text>
      <ButtonLink href="/" leftSection={<IconHome size={16} />}>
        トップページへ戻る
      </ButtonLink>
    </Stack>
  );
};

export default NotFoundPage;
