import { useState } from "react";

import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import {
  countNewResources,
  filterLocalData,
  getGameParticipantIds,
  listQuizSets,
} from "@/utils/migration/local-data";
import { rules } from "@/utils/rules";

import type { LocalExportFileType, PreviewLocalDataImportResponseType } from "@/models/migration";

type Props = {
  data: LocalExportFileType;
  preview: PreviewLocalDataImportResponseType;
  isPending: boolean;
  onImport: (data: LocalExportFileType, startLimitGrace: boolean) => void;
  onClose: () => void;
};

type ResourceCounts = { game: number; player: number; quiz: number };

const RESOURCES = [
  { key: "game", label: "ゲーム" },
  { key: "player", label: "プレイヤー" },
  { key: "quiz", label: "問題" },
] as const;

const exceedsLimits = (usage: ResourceCounts, adding: ResourceCounts, limits: ResourceCounts) =>
  RESOURCES.some(({ key }) => usage[key] + adding[key] > limits[key]);

type SelectionGroupProps = {
  title: string;
  items: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
};

const SelectionGroup: React.FC<SelectionGroupProps> = ({ title, items, value, onChange }) => {
  if (items.length === 0) return null;

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={5}>{title}</Title>
        <Group gap="xs">
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => onChange(items.map((item) => item.value))}
          >
            すべて選択
          </Button>
          <Button variant="subtle" size="compact-xs" onClick={() => onChange([])}>
            すべて解除
          </Button>
        </Group>
      </Group>
      <ScrollArea.Autosize mah={180}>
        <Checkbox.Group value={value} onChange={onChange}>
          <Stack gap={6}>
            {items.map((item) => (
              <Checkbox key={item.value} value={item.value} label={item.label} />
            ))}
          </Stack>
        </Checkbox.Group>
      </ScrollArea.Autosize>
    </Stack>
  );
};

const ImportSelectionModal: React.FC<Props> = ({ data, preview, isPending, onImport, onClose }) => {
  const quizSets = listQuizSets(data);
  const [gameIds, setGameIds] = useState(data.games.map((localGame) => localGame.id));
  const [quizSetNames, setQuizSetNames] = useState(quizSets.map((set) => set.name));
  const [playerIds, setPlayerIds] = useState(data.players.map((localPlayer) => localPlayer.id));

  const participantIds = getGameParticipantIds(data, gameIds);
  const otherPlayers = data.players.filter((localPlayer) => !participantIds.has(localPlayer.id));

  const selectedData = filterLocalData(data, { gameIds, quizSetNames, playerIds });
  const selectedCounts = countNewResources(selectedData, preview.matchedPlayerIds);
  const allCounts = countNewResources(data, preview.matchedPlayerIds);

  const isSelectionOver = exceedsLimits(preview.usage, selectedCounts, preview.limits);
  const isSelectionEmpty = RESOURCES.every(({ key }) => selectedCounts[key] === 0);
  const canImportAllWithGrace =
    preview.canStartLimitGrace && !exceedsLimits(preview.usage, allCounts, preview.graceLimits);

  return (
    <Modal opened onClose={onClose} title="取り込むデータを選ぶ" size="lg" centered>
      <Stack>
        <Text size="sm">
          すべて取り込むとプランの上限を超えます。取り込むゲームと問題セットを選んでください。選んだゲームの参加プレイヤーは自動で取り込まれます。
        </Text>

        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th />
              <Table.Th>登録済み</Table.Th>
              <Table.Th>取り込み</Table.Th>
              <Table.Th>上限</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {RESOURCES.map(({ key, label }) => {
              const isOver = preview.usage[key] + selectedCounts[key] > preview.limits[key];

              return (
                <Table.Tr key={key}>
                  <Table.Td>{label}</Table.Td>
                  <Table.Td>{preview.usage[key]}</Table.Td>
                  <Table.Td c={isOver ? "red" : undefined} fw={isOver ? 700 : undefined}>
                    {selectedCounts[key]}
                  </Table.Td>
                  <Table.Td>{preview.limits[key]}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>

        <SelectionGroup
          title="ゲーム"
          items={data.games.map((localGame) => ({
            value: localGame.id,
            label: `${localGame.name}（${rules[localGame.rule].name}・${localGame.players.length}人）`,
          }))}
          value={gameIds}
          onChange={setGameIds}
        />
        <SelectionGroup
          title="問題セット"
          items={quizSets.map((set) => ({
            value: set.name,
            label: `${set.name}（${set.count}問）`,
          }))}
          value={quizSetNames}
          onChange={setQuizSetNames}
        />
        <SelectionGroup
          title="ゲームに参加していないプレイヤー"
          items={otherPlayers.map((localPlayer) => ({
            value: localPlayer.id,
            label: localPlayer.name,
          }))}
          value={playerIds.filter((id) => !participantIds.has(id))}
          onChange={(value) => setPlayerIds([...value, ...participantIds])}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            onClick={() => onImport(selectedData, false)}
            loading={isPending}
            disabled={isPending || isSelectionOver || isSelectionEmpty}
          >
            選んだデータを取り込む
          </Button>
        </Group>

        {canImportAllWithGrace && (
          <Alert
            color="teal"
            icon={<IconAlertTriangle />}
            title="すべて取り込んでアップグレードする"
          >
            <Text size="sm">
              すべてのデータを取り込み、{preview.limitGraceDays}
              日間はプラスプランの上限で利用できるようにします。期間内にプラスプランへアップグレードしてください。期間を過ぎると、上限を下回るまで新しく作成できなくなります。この猶予期間は1回だけ利用できます。
            </Text>
            <Button
              mt="sm"
              color="teal"
              onClick={() => onImport(data, true)}
              loading={isPending}
              disabled={isPending}
            >
              すべて取り込んでアップグレードする
            </Button>
          </Alert>
        )}
      </Stack>
    </Modal>
  );
};

export default ImportSelectionModal;
