import { useEffect, useMemo, useState } from "react";

import { Box, Button, Group, Table, Text } from "@mantine/core";
import { IconCheck, IconCopy, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { cdate } from "cdate";

import classes from "./GameLogs.module.css";

import type { BoardQuizType, GamePlayerProps } from "@/models/game";
import type { SeriarizedGameLog } from "@/utils/drizzle/types";

type GameLogsProps = {
  logs: SeriarizedGameLog[];
  players: GamePlayerProps[];
  order: "asc" | "desc";
  onToggleOrder: () => void;
  quizList: BoardQuizType[];
  quizOffset: number;
};

const GameLogs: React.FC<GameLogsProps> = ({
  logs,
  players,
  order,
  onToggleOrder,
  quizList,
  quizOffset,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => log.actionType !== "multiple_wrong");
  }, [logs]);

  const shownLogs = useMemo(() => {
    return order === "asc" ? filteredLogs : [...filteredLogs].reverse();
  }, [filteredLogs, order]);

  // スキップを挟むと問題とログの対応が崩れるため、その場合は問題文を表示しない
  const showQuiz = useMemo(() => {
    return quizList.length > 0 && !logs.some((log) => log.actionType === "skip");
  }, [quizList, logs]);

  /** 表示順を考慮して、そのログに対応する問題を取得する */
  const getQuizForRow = (rowIndex: number) => {
    const logIndex = order === "desc" ? filteredLogs.length - rowIndex - 1 : rowIndex;
    return quizList[quizOffset + logIndex];
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyAsHTML = async () => {
    const logsWithTableFormat = `<table><tbody>${shownLogs
      .map((log, qn) => {
        const player = players.find((p) => p.id === log.playerId);
        const quiz = showQuiz ? getQuizForRow(qn) : undefined;
        return `
        <tr>
          <td>${order === "desc" ? filteredLogs.length - qn : qn + 1}.</td>
          <td>${player ? player.name : log.actionType === "through" ? "(スルー)" : "-"}</td>
          <td>${log.actionType === "correct" ? "o" : log.actionType === "wrong" ? "x" : "-"}</td>
          <td>${cdate(log.timestamp || new Date().toISOString()).format("YYYY/MM/DD HH:mm:ss")}</td>${
            quiz ? `\n          <td>${quiz.question}</td>\n          <td>${quiz.answer}</td>` : ""
          }
        </tr>`;
      })
      .join("")}
    </tbody></table>`;

    try {
      const blob = new Blob([logsWithTableFormat], {
        type: "text/html",
      });
      await window.navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
    } catch (e) {
      console.error("Failed to copy logs html:", e);
    }
  };

  return (
    <Box className={classes.game_logs}>
      <Group justify="space-between" mb="1rem">
        <Text fw={700}>Game Logs</Text>
        <Group>
          <Button
            size="xs"
            onClick={copyAsHTML}
            leftSection={copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
          >
            コピーする
          </Button>
          <Button
            leftSection={
              order === "desc" ? <IconSortAscending size={20} /> : <IconSortDescending size={20} />
            }
            onClick={onToggleOrder}
            size="xs"
          >
            {order === "desc" ? "降順" : "昇順"}
          </Button>
        </Group>
      </Group>
      {filteredLogs.length !== 0 ? (
        <Table.ScrollContainer minWidth={1000}>
          <Table highlightOnHover>
            <Table.Tbody>
              {shownLogs.map((log, qn) => {
                const player = players.find((p) => p.id === log.playerId);
                const quiz = showQuiz ? getQuizForRow(qn) : undefined;
                return (
                  <Table.Tr key={log.id}>
                    <Table.Td>{order === "desc" ? filteredLogs.length - qn : qn + 1}.</Table.Td>
                    <Table.Td>
                      {player ? player.name : log.actionType === "through" ? "(スルー)" : "-"}
                    </Table.Td>
                    <Table.Td>
                      {log.actionType === "correct" ? "o" : log.actionType === "wrong" ? "x" : "-"}
                    </Table.Td>
                    <Table.Td
                      title={cdate(log.timestamp || new Date().toISOString()).format(
                        "YYYY年MM月DD日 HH時mm分ss秒"
                      )}
                    >
                      {cdate(log.timestamp || new Date().toISOString()).format("HH:mm:ss")}
                    </Table.Td>
                    {quiz && (
                      <>
                        <Table.Td>{quiz.question}</Table.Td>
                        <Table.Td className={classes.answer}>{quiz.answer}</Table.Td>
                      </>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <p>ここに解答者の一覧が表示されます。</p>
      )}
    </Box>
  );
};

export default GameLogs;
