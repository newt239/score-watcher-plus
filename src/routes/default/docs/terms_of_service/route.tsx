import { Group, List, Text, Title } from "@mantine/core";

import Link from "@/components/Link";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "利用規約 - Score Watcher" },
  {
    tagName: "link",
    rel: "canonical",
    href: "https://plus.score-watcher.com/docs/terms_of_service",
  },
];

const TermsOfServicePage = () => {
  return (
    <>
      <Title order={2}>利用規約</Title>
      <Text mb="sm">
        この規約は、本ウェブサイト（PWAモードやベータ版サイト、プレビュー版サイトを含む）から提供している得点表示サービス（以下「本サービス」といいます）の利用に関する条件を定めるものです。
      </Text>
      <Text mb="sm">
        本サービスの利用者は、自らの責任において本サービスを使用することに同意し、本サービスの利用によって生じる一切の損害、損失について、本サービスの開発者は損害賠償義務及びその他一切の責任を負いません。
      </Text>

      <Title order={3} mt="lg">
        アカウントについて
      </Title>
      <Text mb="sm">
        本サービスの利用にはGoogleアカウントによるログインが必要です。ログインに用いるアカウントの管理は利用者の責任で行うものとし、第三者による不正な利用について開発者は責任を負いません。
      </Text>
      <Text mb="sm">
        アカウントはユーザー設定ページからいつでも削除できます。削除した場合、保存されているデータもすべて削除され、復元することはできません。
      </Text>

      <Title order={3} mt="lg">
        保存データの取り扱い
      </Title>
      <Text mb="sm">
        利用者が登録したプレイヤー・問題・ゲームのデータはサーバー上に保存されます。開発者はデータの保全に努めますが、障害・不具合・運用上の都合によりデータが消失する可能性があります。重要なデータはエクスポート機能によるバックアップを推奨します。
      </Text>
      <Text mb="sm">
        個人情報の取り扱いについては
        <Link href="/docs/privacy_policy">プライバシーポリシー</Link>をご確認ください。
      </Text>

      <Title order={3} mt="lg">
        公開設定について
      </Title>
      <Text mb="sm">
        ゲームを公開設定にすると、観戦用URLを知っている誰でも、そのゲームのプレイヤー名・所属・得点および進行状況を閲覧できるようになります。第三者の個人情報を登録している場合は、公開する前に本人の同意を得てください。
      </Text>

      <Title order={3} mt="lg">
        禁止事項
      </Title>
      <Text mb="sm">本サービスの利用にあたり、次の行為を禁止します。</Text>
      <List mb="sm">
        <List.Item>公序良俗に反する目的での利用</List.Item>
        <List.Item>法令に違反する行為、または違反を助長する行為</List.Item>
        <List.Item>第三者の権利を侵害する内容の登録・公開</List.Item>
        <List.Item>
          本サービスのサーバーに過度な負荷をかける行為、および自動化された手段による大量のアクセス
        </List.Item>
        <List.Item>開発者が意図するものと著しくかけ離れた方法での利用</List.Item>
      </List>
      <Text mb="sm">
        これらに該当すると開発者が判断した場合、事前の通知なくアカウントの利用停止または削除を行うことがあります。
      </Text>

      <Title order={3} mt="lg">
        商用利用について
      </Title>
      <Text mb="sm">
        本サービスを商用利用することは、原則禁止とします。詳しくは
        <Link href="/docs/for_commercial_use">商用利用に関するルール</Link>
        をご確認ください。
      </Text>

      <Title order={3} mt="lg">
        サービスの変更・中断・終了
      </Title>
      <Text mb="sm">
        開発者は、事前の通知なく本サービスの内容を変更し、また提供を中断・終了することがあります。これにより利用者に生じた損害について、開発者は責任を負いません。
      </Text>

      <Title order={3} mt="lg">
        規約の改定
      </Title>
      <Text mb="sm">全ての規約は、予告無く改変する場合があります。</Text>
      <Text mb="sm">本サービスを利用することで、これらの規約に同意したとみなします。</Text>

      <Group justify="end">2024年7月18日 制定 / 2026年7月24日 改定</Group>
    </>
  );
};

export default TermsOfServicePage;
