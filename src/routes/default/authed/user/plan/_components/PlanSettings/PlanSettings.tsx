import { useEffect, useState, useTransition } from "react";

import { Badge, Button, Card, Group, List, SegmentedControl, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconExternalLink } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useSearchParams } from "react-router";

import { formatDisplayDate } from "@/utils/date";
import createApiClient from "@/utils/hono/browser";

import classes from "./PlanSettings.module.css";

import type {
  BillingIntervalType,
  GetSubscriptionStatusResponseType,
  PlanPricesType,
  PriceInfoType,
} from "@/models/subscription";

type PlanSettingsProps = {
  subscription: GetSubscriptionStatusResponseType;
  /** 決済機能が利用できる状態かどうか */
  isBillingAvailable: boolean;
  /** プランの月払い・週払いの価格 */
  prices: PlanPricesType;
};

/** 価格を日本語の通貨表記に整形する */
const formatPrice = (price: PriceInfoType): string => {
  if (!price) {
    return "";
  }
  const formatted = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
  return ` ${formatted}`;
};

/** 契約中のプランと利用状況を表示し、プランの変更導線を提供するコンポーネント */
const PlanSettings: React.FC<PlanSettingsProps> = ({
  subscription,
  isBillingAvailable,
  prices,
}) => {
  const [isPending, startTransition] = useTransition();
  const [interval, setInterval] = useState<BillingIntervalType>("month");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status !== "success" && status !== "cancel") {
      return;
    }

    if (status === "success") {
      notifications.show({
        title: "アップグレードが完了しました",
        message: "プラスプランの機能が利用できます。",
        color: "green",
      });
    } else {
      notifications.show({
        title: "決済をキャンセルしました",
        message: "プランの変更は行われませんでした。",
        color: "gray",
      });
    }

    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /** Checkoutページへ遷移する */
  const startCheckout = () => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.stripe["create-checkout-session"].$post({
            json: { planCode: "plus", interval },
          })
        );

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        window.location.href = result.url;
      } catch (error) {
        console.error("Failed to start checkout:", error);
        notifications.show({
          title: "エラー",
          message: "決済ページを開けませんでした",
          color: "red",
        });
      }
    });
  };

  /** 契約管理ページへ遷移する */
  const openPortal = () => {
    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(apiClient.stripe.portal.$post());

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        window.location.href = result.url;
      } catch (error) {
        console.error("Failed to open billing portal:", error);
        notifications.show({
          title: "エラー",
          message: "契約管理ページを開けませんでした",
          color: "red",
        });
      }
    });
  };

  const isPlus = subscription.planCode === "plus";

  return (
    <>
      <Group gap="sm" mb="md">
        <Title order={3}>現在のプラン</Title>
        <Badge color={isPlus ? "teal" : "gray"} size="lg">
          {subscription.planName}
        </Badge>
      </Group>

      {subscription.currentPeriodEnd && (
        <Text size="sm" c="dimmed" mb="md">
          {subscription.cancelAtPeriodEnd
            ? `${formatDisplayDate(subscription.currentPeriodEnd, "YYYY年MM月DD日")}にフリープランへ戻ります。`
            : `次回の更新日は${formatDisplayDate(subscription.currentPeriodEnd, "YYYY年MM月DD日")}です。`}
        </Text>
      )}

      <Title order={4} mt="lg" mb="xs">
        利用状況
      </Title>
      <List mb="lg">
        <List.Item>
          ゲーム: {subscription.usage.game} / {subscription.limits.game}
        </List.Item>
        <List.Item>
          プレイヤー: {subscription.usage.player} / {subscription.limits.player}
        </List.Item>
        <List.Item>
          問題: {subscription.usage.quiz} / {subscription.limits.quiz}
        </List.Item>
      </List>

      {!isBillingAvailable ? (
        <Text size="sm" c="dimmed">
          現在プランの変更は受け付けていません。
        </Text>
      ) : isPlus ? (
        <Button
          onClick={openPortal}
          loading={isPending}
          leftSection={<IconExternalLink size={16} />}
        >
          支払い方法・解約の管理
        </Button>
      ) : (
        <Card withBorder className={classes.plan_card}>
          <Title order={4}>プラスプランにアップグレード</Title>
          <List mt="sm" spacing="xs" icon={<IconCheck size={16} />}>
            <List.Item>ゲームを100件まで作成できます</List.Item>
            <List.Item>プレイヤーを500件まで登録できます</List.Item>
            <List.Item>問題を2000件まで登録できます</List.Item>
            <List.Item>観戦ページへのアクセス上限が大きくなります</List.Item>
          </List>
          <SegmentedControl
            mt="md"
            value={interval}
            onChange={(value) => setInterval(value === "week" ? "week" : "month")}
            data={[
              { label: `月払い${formatPrice(prices.month)}`, value: "month" },
              { label: `週払い${formatPrice(prices.week)}`, value: "week" },
            ]}
          />
          <Button mt="md" onClick={startCheckout} loading={isPending}>
            アップグレードする
          </Button>
        </Card>
      )}
    </>
  );
};

export default PlanSettings;
