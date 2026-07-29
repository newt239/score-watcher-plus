import { Flex } from "@mantine/core";
import { Outlet } from "react-router";

import { getUser } from "@/utils/auth/auth-helpers";

import Header from "./_components/Header/Header";
import classes from "./layout.module.css";

import type { Route } from "./+types/layout";

/** ヘッダーがログイン状態を出し分けるためユーザーを取得する */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request.headers);

  return { user } as const;
};

const DefaultLayout = ({ loaderData }: Route.ComponentProps) => {
  return (
    <Flex className={classes.wrapper}>
      <Header user={loaderData.user} />
      <div className={classes.under_header}></div>
      <main className={classes.main}>
        <Outlet />
      </main>
    </Flex>
  );
};

export default DefaultLayout;
