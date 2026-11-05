import { Box, Title } from "@mantine/core";

import { userContext } from "@/context";
import { getSubscriptionStatus } from "@/server/repositories/subscription";
import { getPlanPrices, isBillingAvailable } from "@/server/utils/subscription/stripe";

import PlanSettings from "./_components/PlanSettings/PlanSettings";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "プラン - Score Watcher" },
  { name: "robots", content: "noindex" },
];

/** 契約中のプランを確認・変更するページ */
export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  return {
    prices: await getPlanPrices("plus"),
    subscription: await getSubscriptionStatus(user.id),
    isBillingAvailable: isBillingAvailable(),
  } as const;
};

const PlanPage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <Box maw={600} mx="auto" mt="xl">
      <Title order={2} mb="md">
        プラン
      </Title>
      <PlanSettings
        subscription={loaderData.subscription}
        isBillingAvailable={loaderData.isBillingAvailable}
        prices={loaderData.prices}
      />
    </Box>
  );
};

export default PlanPage;
