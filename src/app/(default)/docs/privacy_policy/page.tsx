import type { Metadata } from "next";

import { Group, List, Text, Title } from "@mantine/core";

import Link from "@/components/Link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  alternates: {
    canonical: "https://plus.score-watcher.com/docs/privacy_policy",
  },
};

const PrivacyPolicyPage = () => {
  return (
    <>
      <Title order={2}>プライバシーポリシー</Title>
      <Text mb="sm">
        Score
        Watcher（以下「本サービス」といいます）における、利用者の情報の取り扱いについて以下のとおり定めます。
      </Text>

      <Title order={3} mt="lg">
        取得する情報
      </Title>
      <Text mb="sm">本サービスでは、次の情報を取得します。</Text>
      <List mb="sm">
        <List.Item>
          <b>アカウント情報</b>
          ：Googleアカウントでログインした際に、Googleから提供されるメールアドレス、氏名、プロフィール画像のURL、およびアカウントを識別するためのIDを取得します。パスワードは取得しません。
        </List.Item>
        <List.Item>
          <b>利用者が登録したデータ</b>
          ：プレイヤー、問題、ゲームの設定や進行状況など、利用者が本サービス上で作成・保存したデータを取得します。
        </List.Item>
        <List.Item>
          <b>アクセス情報</b>
          ：アクセス解析およびエラー監視のため、ブラウザの種類、閲覧したページ、発生したエラーの内容などの情報を取得します。
        </List.Item>
      </List>

      <Title order={3} mt="lg">
        利用目的
      </Title>
      <Text mb="sm">
        取得した情報は、本サービスの提供（ログイン状態の維持、データの保存と表示）、不具合の調査と改善、および利用状況の把握のために利用します。これら以外の目的には利用しません。
      </Text>

      <Title order={3} mt="lg">
        情報の保存場所
      </Title>
      <Text mb="sm">
        アカウント情報および利用者が登録したデータは、Turso（データベース）に保存されます。観戦モードで表示する進行状況は、表示を高速化するためCloudflare
        Workers
        KVに一時的に保存されます。本サービス自体はVercel上で稼働しています。いずれも国外のサーバーに保存される場合があります。
      </Text>

      <Title order={3} mt="lg">
        第三者への提供
      </Title>
      <Text mb="sm">
        取得した情報を、利用者の同意なく第三者へ販売・提供することはありません。ただし、利用者が
        <b>ゲームを公開設定にした場合に限り</b>
        、そのゲームに登録されたプレイヤーの名前・所属・得点および進行状況が、観戦用URLを知っている誰でも閲覧できる状態になります。メールアドレスなどのアカウント情報が公開されることはありません。
      </Text>
      <Text mb="sm">
        なお、法令に基づき開示が求められた場合には、必要な範囲で情報を開示することがあります。
      </Text>

      <Title order={3} mt="lg">
        保存期間と削除
      </Title>
      <Text mb="sm">
        取得した情報は、アカウントが存在する間保存されます。ユーザー設定ページからアカウントを削除すると、アカウント情報および登録されたデータはすべて削除されます。削除したデータを復元することはできません。
      </Text>

      <Title order={3} mt="lg">
        アクセス解析ツールについて
      </Title>
      <Text mb="sm">
        当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
      </Text>
      <Text mb="sm">
        この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は
        <Link href="https://marketingplatform.google.com/about/analytics/terms/jp/">
          Googleアナリティクスサービス利用規約
        </Link>
        のページをご覧ください。
      </Text>

      <Title order={3} mt="lg">
        エラー監視ツールについて
      </Title>
      <Text mb="sm">
        当サイトでは、エラー監視ツール「Sentry」を使用しています。このSentryはエラーの発生箇所や発生回数を収集するためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
      </Text>
      <Text mb="sm">
        この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は
        <Link href="https://sentry.io/privacy/">Sentryプライバシーポリシー</Link>
        のページをご覧ください。
      </Text>

      <Title order={3} mt="lg">
        お問い合わせ
      </Title>
      <Text mb="sm">
        本ポリシーに関するお問い合わせは、
        <Link href="https://discord.gg/rct5sx6rbZ">開発者のDiscordサーバー</Link>
        または<Link href="https://twitter.com/newt239">X（旧Twitter）</Link>
        よりご連絡ください。
      </Text>

      <Title order={3} mt="lg">
        改定について
      </Title>
      <Text mb="sm">
        本ポリシーは、法令の変更やサービス内容の変更に応じて予告なく改定することがあります。
      </Text>

      <Group justify="end">2026年7月24日 改定</Group>
    </>
  );
};

export default PrivacyPolicyPage;
