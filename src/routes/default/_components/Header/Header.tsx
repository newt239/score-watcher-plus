import { Anchor, Box, Flex } from "@mantine/core";

import ClientLink from "@/components/ClientLink/ClientLink";

import Hamburger from "../Hamburger/Hamburger";
import SubMenu from "../SubMenu";
import classes from "./Header.module.css";

import type { User } from "@/utils/auth/auth";

type HeaderProps = {
  user: User | null;
};

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <Box component="header" className={classes.header}>
      <Flex className={classes.header_inner}>
        <Flex component={ClientLink} className={classes.header_link} href="/">
          <picture className={classes.header_logo}>
            <source media="(min-width:62em)" srcSet="/logo_white2.png" />
            <source media="(max-width:62em)" srcSet="/logo_white.png" />
            <img
              src="/logo_white.png"
              alt="Score Watcherのロゴ。三日月の中央に円が配置されたモノカラー"
            />
          </picture>
        </Flex>
        <Box hiddenFrom="md">
          <Hamburger>
            <SubMenu user={user} />
          </Hamburger>
        </Box>
        <Flex hidden visibleFrom="md" className={classes.header_menu_desktop}>
          <SubMenu user={user} />
          <Flex direction="column" gap={4}>
            <Flex className={classes.header_copyright}>
              <Box>
                ©{" "}
                <Anchor component={ClientLink} c="white" href="https://twitter.com/newt239">
                  newt239
                </Anchor>
              </Box>
              <Box>2022-2025</Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
