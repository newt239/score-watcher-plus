"use client";

import { useState } from "react";

import { Group, Input, Text, Title } from "@mantine/core";
import Link from "next/link";

import ButtonLink from "@/components/ButtonLink";

const ViewerNotFound = () => {
  const [gameId, setGameId] = useState("");

  return (
    <main style={{ padding: "1rem" }}>
      <Title order={2}>見つかりませんでした</Title>
      <Text>お探しのゲームは存在しないか、非公開に設定されています。</Text>
      <Text>以下のフォームからIDを入力し直してください。</Text>
      <Group gap="sm" my="lg">
        <Input placeholder="ゲームID" value={gameId} onChange={(e) => setGameId(e.target.value)} />
        <ButtonLink href={`/viewer/${gameId}`} disabled={gameId.trim() === ""}>
          観戦する
        </ButtonLink>
      </Group>
      <Text>
        <Link href="https://plus.score-watcher.com/">https://plus.score-watcher.com/</Link>
      </Text>
    </main>
  );
};

export default ViewerNotFound;
