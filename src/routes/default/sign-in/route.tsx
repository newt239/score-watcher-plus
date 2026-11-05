import { useState, useTransition } from "react";

import { Alert, Button, Text, Title } from "@mantine/core";
import { useSearchParams } from "react-router";

import Link from "@/components/Link";
import { authClient } from "@/utils/auth/auth-client";

import { PENDING_QUICKSTART_KEY } from "../_components/QuickStart/create-game";

/** 同一オリジン内のパスだけをログイン後の遷移先として許可する */
const resolveNextPath = (next: string | null) => {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;

  return next;
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = resolveNextPath(searchParams.get("next"));

  const handleLogin = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const hasPendingQuickStart = sessionStorage.getItem(PENDING_QUICKSTART_KEY) !== null;
        await authClient.signIn.social({
          provider: "google",
          callbackURL: hasPendingQuickStart ? "/quickstart" : (nextPath ?? "/"),
        });
      } catch (err) {
        console.error("サインインエラー:", err);
        setError("サインインに失敗しました。もう一度お試しください。");
      }
    });
  };

  return (
    <main>
      <Title>ログイン</Title>
      <Text mt="md">
        Googleアカウントでログインすると、プレイヤーや問題、ゲームのデータをサーバーに保存して
        どの端末からでも利用できます。
      </Text>
      {nextPath && (
        <Text mt="sm" size="sm">
          ログインすると元のページに戻り、続きの操作を行えます。
        </Text>
      )}
      <Text mt="sm" size="sm" c="dimmed">
        ログインすることで<Link href="/docs/terms_of_service">利用規約</Link>及び
        <Link href="/docs/privacy_policy">プライバシーポリシー</Link>に同意したものとみなします。
      </Text>
      <Button mt="lg" onClick={handleLogin} color="blue" loading={isPending} disabled={isPending}>
        Googleでログイン
      </Button>
      {error && (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      )}
    </main>
  );
};

export default LoginPage;
