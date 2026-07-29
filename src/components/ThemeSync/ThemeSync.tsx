import { useEffect } from "react";

import { useMantineColorScheme } from "@mantine/core";

type ThemeSyncProps = {
  theme: "light" | "dark";
};

/** サーバーに保存されたテーマ設定を画面のカラースキームへ反映する */
const ThemeSync: React.FC<ThemeSyncProps> = ({ theme }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (colorScheme !== theme) {
      setColorScheme(theme);
    }
  }, [theme, colorScheme, setColorScheme]);

  return null;
};

export default ThemeSync;
