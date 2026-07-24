import { useEffect, useState } from "react";

import { Box, List, ListItem, Modal, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import Link from "@/components/Link";

const UpdateModal: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>("");
  const latestVersion = import.meta.env.VITE_APP_VERSION;

  useEffect(() => {
    const raw = window.localStorage.getItem("scorewatcher-version");
    if (raw !== latestVersion) {
      setCurrentVersion(raw);
      open();
      window.localStorage.setItem("scorewatcher-version", latestVersion!);
    }
    // キャッシュ全削除
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          // 登録されているworkerを全て削除する
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      });
    });
  }, []);

  const feature = {
    news: (
      <>
        オンライン版を正式リリースしました。データはサーバーに保存され、どの端末からでも同じデータを利用できます。ローカル（オフライン）版の提供は終了しました。
      </>
    ),
    feature: [
      "得点表示画面とゲームログに問題文と答えを表示する機能を追加",
      "スコアや背景色をその場で書き換えられる「スコアの手動更新」モードを追加",
      "限定問題数と勝ち抜け人数の設定を追加",
      "複数の端末で同じ得点表示画面を開いても操作が反映されるように",
      "ゲームのリセット機能とエクスポートしたJSONのインポート機能を追加",
      "アカウントの削除機能を追加",
    ],
    bugfix: [
      "観戦モードで公開直後や操作の取り消し後に表示できない不具合を修正",
      "Variablesでプレイヤーごとの変動値Nが反映されない不具合を修正",
      "FreezeXで休みの残り問題数が正しく表示されない不具合を修正",
    ],
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="新しいバージョンがリリースされました"
      centered
      size="auto"
    >
      <Box>
        {currentVersion && `v.${currentVersion} から`} v.{latestVersion} にアップデートしました。
      </Box>
      {feature && (
        <>
          {feature.news && (
            <Box mt="md">
              <Title order={3}>📢お知らせ</Title>
              {feature.news}
            </Box>
          )}
          {feature.feature.length > 0 && (
            <Box mt="md">
              <Title order={3}>🎉新機能</Title>
              <List>
                {feature.feature.map((v, i) => (
                  <ListItem key={i}>{v}</ListItem>
                ))}
              </List>
            </Box>
          )}
          {feature.bugfix.length > 0 && (
            <Box mt="md">
              <Title order={3}>🐛不具合修正</Title>
              <List>
                {feature.bugfix.map((v, i) => (
                  <ListItem key={i}>{v}</ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
      <Box mt="md">
        詳細は
        <Link href="https://github.com/newt239/next-score-watcher/releases">リリースノート</Link>
        をご確認ください。
      </Box>
    </Modal>
  );
};

export default UpdateModal;
