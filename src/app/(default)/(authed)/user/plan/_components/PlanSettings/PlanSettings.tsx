"use client";

import { useState, useTransition } from "react";

import { Badge, Button, Card, Group, List, SegmentedControl, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconExternalLink } from "@tabler/icons-react";
import { cdate } from "cdate";
import { parseResponse } from "hono/client";

import createApiClient from "@/utils/hono/browser";

import classes from "./PlanSettings.module.css";

import type { BillingIntervalType, GetSubscriptionStatusResponseType } from "@/models/subscription";

type PlanSettingsProps = {
  subscription: GetSubscriptionStatusResponseType;
  /** 決済機能が利用できる状態かどうか */
  isBillingAvailable: boolean;
};

/** 契約中のプランと利用状況を表示し、プランの変更導線を提供するコンポーネント */
const PlanSettings: React.FC<PlanSettingsProps> = ({ subscription, isBillingAvailable }) => {
  const [isPending, startTransition] = useTransition();
  const [interval, setInterval] = useState<BillingIntervalType>("month");

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
            ? `${cdate(subscription.currentPeriodEnd).format("YYYY年MM月DD日")}にフリープランへ戻ります。`
            : `次回の更新日は${cdate(subscription.currentPeriodEnd).format("YYYY年MM月DD日")}です。`}
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
              { label: "月払い", value: "month" },
              { label: "週払い", value: "week" },
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
