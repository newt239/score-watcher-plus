import { Box, Button, Image } from "@mantine/core";
import { IconLogin2 } from "@tabler/icons-react";

import ClientLink from "@/components/ClientLink/ClientLink";

import QuickStart from "../QuickStart/QuickStart";
import classes from "./Hero.module.css";

type HeroProps = {
  isLoggedIn: boolean;
};

const Hero = ({ isLoggedIn }: HeroProps) => {
  return (
    <Box className={classes.hero}>
      <Image alt="大会画像" src="/images/hero.webp" className={classes.hero_image} />
      <Box aria-hidden className={classes.hero_overlay} />
      <Box className={classes.hero_content}>
        <Box className={classes.hero_text_area}>
          <Box className={classes.hero_text}>
            <Box>競技クイズのための</Box>
            <Box>得点表示アプリ</Box>
          </Box>
          <Box className={classes.hero_description}>
            <p>スコアの表示だけでなく、勝ち抜け・敗退状態や</p>
            <p>問題文の表示にも対応</p>
          </Box>
          {!isLoggedIn && (
            <Button
              className={classes.login_button}
              component={ClientLink}
              href="/sign-in"
              leftSection={<IconLogin2 />}
              size="lg"
              variant="white"
            >
              ログインして始める
            </Button>
          )}
        </Box>
        <Box className={classes.card_slot}>
          <QuickStart isLoggedIn={isLoggedIn} />
        </Box>
      </Box>
    </Box>
  );
};

export default Hero;
