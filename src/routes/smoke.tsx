import { Button, Title } from "@mantine/core";

import { cloudflareContext } from "@/context";

import classes from "./smoke.module.css";

import type { Route } from "./+types/smoke";

export const meta: Route.MetaFunction = () => [{ title: "Smoke - Score Watcher" }];

export const loader = ({ context }: Route.LoaderArgs) => {
  return { hasKvBinding: Boolean(context.get(cloudflareContext).env.BOARD_CACHE) } as const;
};

const SmokePage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className={classes.smoke_box}>
      <Title order={1}>Scaffold OK</Title>
      <p>KV binding: {String(loaderData.hasKvBinding)}</p>
      <Button>Mantine Button</Button>
    </div>
  );
};

export default SmokePage;
