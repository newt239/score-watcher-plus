import { useState, useTransition } from "react";

import { Alert, Button, Text, Title } from "@mantine/core";

import Link from "@/components/Link";
import { authClient } from "@/utils/auth/auth-client";

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async () => {
    setError(null);
    startTransition(async () => {
      try {
        await authClient.signIn.social({
          provider: "google",
          callbackURL: "/",
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
