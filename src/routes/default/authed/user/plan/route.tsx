import { Box, Title } from "@mantine/core";

import { userContext } from "@/context";
import { countUserResources, getUserSubscription } from "@/server/repositories/subscription";
import { PLAN_LIMITS } from "@/server/utils/subscription/config";

import PlanSettings from "./_components/PlanSettings/PlanSettings";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "プラン - Score Watcher" },
  { name: "robots", content: "noindex" },
];

/** 契約中のプランを確認・変更するページ */
export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  const subscription = await getUserSubscription(user.id);
  const usage = await countUserResources(user.id);
  const limits = PLAN_LIMITS[subscription.planCode];

  return {
    subscription: {
      planCode: subscription.planCode,
      planName: limits.name,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: {
        game: limits.game,
        player: limits.player,
        quiz: limits.quiz,
        viewerRateLimitPerMinute: limits.viewerRateLimitPerMinute,
      },
      usage,
    },
    isBillingAvailable: Boolean(process.env.STRIPE_SECRET_KEY),
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
      />
    </Box>
  );
};

export default PlanPage;
