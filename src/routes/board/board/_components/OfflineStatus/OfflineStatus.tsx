import { useEffect, useState } from "react";

import { Badge, Tooltip } from "@mantine/core";
import { useInterval, useNetwork } from "@mantine/hooks";
import { IconCloudOff, IconCloudUp } from "@tabler/icons-react";

import { useBoardDb } from "../../_hooks/use-board-db";
import classes from "./OfflineStatus.module.css";

const PENDING_COUNT_INTERVAL_MS = 1000;

const OfflineStatus: React.FC = () => {
  const { offlineState, getPendingCount } = useBoardDb();
  const network = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);

  const interval = useInterval(() => setPendingCount(getPendingCount()), PENDING_COUNT_INTERVAL_MS);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, [interval]);

  const isOffline = !network.online;

  if (!isOffline && pendingCount === 0 && offlineState.isLeader) {
    return null;
  }

  if (!offlineState.isLeader) {
    return (
      <Tooltip label="別のタブが同期を担当しているため、このタブではオフライン時の操作が保存されません">
        <Badge className={classes.status} color="gray" leftSection={<IconCloudOff size={14} />}>
          オフライン保存は別タブが担当中
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Badge
      className={classes.status}
      color={isOffline ? "orange" : "blue"}
      leftSection={isOffline ? <IconCloudOff size={14} /> : <IconCloudUp size={14} />}
    >
      {isOffline ? `オフライン・未送信${pendingCount}件` : `送信中${pendingCount}件`}
    </Badge>
  );
};

export default OfflineStatus;
