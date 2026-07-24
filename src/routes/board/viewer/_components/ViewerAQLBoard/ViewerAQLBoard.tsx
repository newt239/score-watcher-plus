import { Flex, Text } from "@mantine/core";

import classes from "../ViewerBoard/ViewerBoard.module.css";

import type { ViewerPlayerType } from "@/models/game";

// AQL専用ボード（観戦専用）
const ViewerAQLBoard = ({ players }: { players: ViewerPlayerType[] }) => {
  return (
    <div className={classes.aql_container}>
      <div className={classes.aql_players}>
        {players.map((player) => (
          <div key={player.player_id} className={classes.aql_player}>
            <Text size="md" fw={600} c="white" ta="center">
              {player.name}
            </Text>
            <Text size="xl" fw={700} c="yellow" ta="center">
              {player.text}
            </Text>
            <Flex gap="sm" justify="center">
              <Text size="sm" c="green">
                {player.correct}
              </Text>
              <Text size="sm" c="red">
                {player.wrong}
              </Text>
            </Flex>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewerAQLBoard;
