import type { Metadata } from "next";

import { Box, Title } from "@mantine/core";
import { parseResponse } from "hono/client";
import { notFound } from "next/navigation";

import { createApiClientOnServer } from "@/utils/hono/server";

import PlanSettings from "./_components/PlanSettings/PlanSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プラン",
  robots: {
    index: false,
  },
};

/** 契約中のプランを確認・変更するページ */
const PlanPage = async () => {
  const apiClient = await createApiClientOnServer();
  const subscription = await parseResponse(apiClient.subscription.status.$get());

  if ("error" in subscription) {
    return notFound();
  }

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Title order={2} mb="md">
        プラン
      </Title>
      <PlanSettings
        subscription={subscription}
        isBillingAvailable={Boolean(process.env.STRIPE_SECRET_KEY)}
      />
    </Box>
  );
};

export default PlanPage;
