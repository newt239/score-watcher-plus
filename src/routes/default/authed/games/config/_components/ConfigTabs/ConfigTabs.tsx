import { Box, Flex, Loader, Tabs, Text } from "@mantine/core";
import { useLocation, useNavigate, useNavigation } from "react-router";

import classes from "./ConfigTabs.module.css";

type ConfigTabsProps = {
  gameId: string;
  children: React.ReactNode;
};

/** 設定ページのタブナビゲーション アクセシビリティを維持しつつLinkコンポーネントで実装 */
const ConfigTabs = ({ gameId, children }: ConfigTabsProps) => {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  // タブ切り替え時のローディング表示（Next.jsのloading.tsxに相当）
  const isLoading = useNavigation().state === "loading";

  return (
    <Tabs
      pt="lg"
      variant="outline"
      className={classes.tabs_area}
      value={pathname.split("/").at(-1)}
      onChange={(value) => navigate(`/games/${gameId}/config/${value}`)}
    >
      <Tabs.List className={classes.tab_list} grow>
        <Tabs.Tab
          value="rule"
          py="md"
          role="tab"
          aria-selected={pathname.split("/").at(-1) === "rule"}
          aria-current={pathname.split("/").at(-1) === "rule" ? "page" : undefined}
          tabIndex={0}
        >
          形式設定
        </Tabs.Tab>
        <Tabs.Tab
          value="player"
          py="md"
          role="tab"
          aria-selected={pathname.split("/").at(-1) === "player"}
          aria-current={pathname.split("/").at(-1) === "player" ? "page" : undefined}
          tabIndex={0}
        >
          プレイヤー設定
        </Tabs.Tab>
        <Tabs.Tab
          value="other"
          py="md"
          role="tab"
          aria-selected={pathname.split("/").at(-1) === "other"}
          aria-current={pathname.split("/").at(-1) === "other" ? "page" : undefined}
          tabIndex={0}
        >
          その他の設定
        </Tabs.Tab>
      </Tabs.List>
      <Box className={classes.tab_panel_area}>
        {isLoading ? (
          <Flex align="center" gap="md" h="50vh" justify="center">
            <Loader size="sm" />
            <Text>読み込み中...</Text>
          </Flex>
        ) : (
          children
        )}
      </Box>
    </Tabs>
  );
};

export default ConfigTabs;
