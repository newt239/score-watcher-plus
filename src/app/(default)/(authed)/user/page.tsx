import type { Metadata } from "next";

import { Avatar, Box, Group, Text, Title } from "@mantine/core";
import { IconCreditCard } from "@tabler/icons-react";
import { redirect } from "next/navigation";

import ButtonLink from "@/components/ButtonLink";
import { defaultUserPreferences } from "@/models/user-preference";
import { getUser } from "@/utils/auth/auth-helpers";
import { createApiClientOnServer } from "@/utils/hono/server";

import DeleteAccount from "./_components/DeleteAccount";
import SignOutButton from "./_components/SignOutButton";
import UserPreferencesSettings from "./_components/UserPreferencesSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ユーザー設定",
  alternates: {
    canonical: "https://plus.score-watcher.com/user",
  },
};

const AccountPage = async () => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const apiClient = await createApiClientOnServer();
  const response = await apiClient.user[":user_id"].preferences.$get({
    param: { user_id: user.id },
  });
  const preferences = await response.json();

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

      <UserPreferencesSettings
        initialPreferences={
          "preferences" in preferences ? preferences.preferences : defaultUserPreferences
        }
        userId={user.id}
      />

      <DeleteAccount userId={user.id} email={user.email} />
    </Box>
  );
};

export default AccountPage;
