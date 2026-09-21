import { Alert, Box, List, Text, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import Link from "@/components/Link";

import ImportLocalData from "./_components/ImportLocalData";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [
  { title: "データ移行 - Score Watcher" },
  { name: "robots", content: "noindex" },
];

const MigrationPage = () => {
  return (
    <Box maw={720} mx="auto" mt="xl">
      <Title order={2} mb="md">
        ローカル版からのデータ移行
      </Title>
      <Text>
        ローカル版のScore
        Watcherで書き出した移行用ファイルを取り込み、ゲーム・プレイヤー・問題をこのアカウントへ引き継ぎます。
        ファイルはローカル版の
        <Link href="https://score-watcher.com/option">設定ページ</Link>
        にある「Score Watcher Plusへの移行」から書き出せます。
      </Text>

      <Box my="lg">
        <ImportLocalData />
      </Box>

      <Alert color="blue" icon={<IconInfoCircle />} title="移行されないデータ">
        <List size="sm">
          <List.Item>「元に戻す」で取り消した操作ログ</List.Item>
          <List.Item>ゲーム参加プレイヤーの誤答時の変動ポイント</List.Item>
          <List.Item>
            スコア計算形式の正答・誤答ポイント（Plusでは正答+1、誤答-1に固定されています）
          </List.Item>
          <List.Item>ローカル版に無い設定項目はPlusの初期値になります</List.Item>
          <List.Item>ブラウザに保存された表示設定と、プロファイルという仕組みそのもの</List.Item>
          <List.Item>ゲームはすべて非公開の状態で作成されます</List.Item>
          <List.Item>
            既に同じ名前のプレイヤーがいる場合はそのプレイヤーを再利用し、タグは追加しません
          </List.Item>
        </List>
      </Alert>
    </Box>
  );
};

export default MigrationPage;
