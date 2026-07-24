import { Avatar, Box, Group, Text, Title } from "@mantine/core";
import { IconCreditCard } from "@tabler/icons-react";

import ButtonLink from "@/components/ButtonLink";
import { userContext } from "@/context";
import { getUserPreferences } from "@/server/repositories/user";

import DeleteAccount from "./_components/DeleteAccount";
import SignOutButton from "./_components/SignOutButton";
import UserPreferencesSettings from "./_components/UserPreferencesSettings";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "ユーザー設定 - Score Watcher" },
  { tagName: "link", rel: "canonical", href: "https://plus.score-watcher.com/user" },
];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  return { user, preferences: await getUserPreferences(user.id) } as const;
};

const AccountPage = ({ loaderData }: Route.ComponentProps) => {
  const { user, preferences } = loaderData;

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Title order={2} mb="md">
        ユーザー設定
      </Title>
      <Group gap={12} mb="md">
        <Avatar src={user.image} alt={user.name} radius="xl" size={48} />
        <Box>
          <Text size="lg" fw={700}>
            {user.name || user.email}
          </Text>
          <Text size="sm" c="dimmed">
            {user.email}
          </Text>
        </Box>
        <SignOutButton />
      </Group>

      <ButtonLink href="/user/plan" variant="default" leftSection={<IconCreditCard size={16} />}>
        プランを確認する
      </ButtonLink>

      <UserPreferencesSettings initialPreferences={preferences} userId={user.id} />

      <DeleteAccount userId={user.id} email={user.email} />
    </Box>
  );
};

export default AccountPage;
