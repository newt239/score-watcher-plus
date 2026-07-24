import { Text } from "@mantine/core";

import classes from "./ViewerPlayer.module.css";

import type { ViewerPlayerType } from "@/models/game";

// 個別プレイヤーカード（観戦専用）
type ViewerPlayerProps = {
  player: ViewerPlayerType;
};

const ViewerPlayer = ({ player }: ViewerPlayerProps) => {
  return (
    <div className={classes.player_card} data-state={player.state}>
      <div className={classes.player_info}>
        <Text size="lg" fw={600}>
          {player.name}
        </Text>
        {player.affiliation && (
          <Text size="sm" c="dimmed">
            {player.affiliation}
          </Text>
        )}
      </div>
      <div className={classes.player_score}>
        <Text size="xl" fw={700}>
          {player.text}
        </Text>
        <div className={classes.player_stats}>
          <Text size="sm" c="red">
            ○{player.correct}
          </Text>
          <Text size="sm" c="blue">
            ✕{player.wrong}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ViewerPlayer;
