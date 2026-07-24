import { useState, useTransition } from "react";

import { NativeSelect, NumberInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconUpload } from "@tabler/icons-react";
import { parseResponse } from "hono/client";
import { useRevalidator } from "react-router";

import ButtonLink from "@/components/ButtonLink";
import { sendGAEvent } from "@/utils/analytics";
import createApiClient from "@/utils/hono/browser";

import type { GameQuizType } from "@/models/game";

type Props = {
  game_id: string;
  game_quiz: GameQuizType;
  quizset_names: readonly string[];
};

/** オンライン版クイズセット選択コンポーネント クイズセットの選択とオフセット設定 */
const SelectQuizset: React.FC<Props> = ({ game_id, game_quiz, quizset_names }) => {
  const revalidator = useRevalidator();
  const [isPending, startTransition] = useTransition();
  const [quiz, setQuiz] = useState<GameQuizType>(game_quiz);

  /** クイズ設定をサーバーへ保存する */
  const updateQuizSetting = (newQuiz: GameQuizType) => {
    setQuiz(newQuiz);

    startTransition(async () => {
      try {
        const apiClient = createApiClient();
        const result = await parseResponse(
          apiClient.games[":gameId"].$patch({
            param: { gameId: game_id },
            json: { key: "quiz", value: newQuiz },
          })
        );

        if ("error" in result) {
          throw new Error(String(result.error));
        }

        revalidator.revalidate();
      } catch (error) {
        console.error("Failed to update quiz setting:", error);
        notifications.show({
          title: "エラー",
          message: "問題設定の保存に失敗しました",
          color: "red",
        });
        setQuiz(game_quiz);
      }
    });
  };

  return (
    <>
      <h3>問題設定</h3>
      {quizset_names.length !== 0 ? (
        <>
          <NativeSelect
            label="セット名"
            description="選択したセットの問題文と答えが得点表示画面に表示されます。"
            value={quiz.setName}
            onChange={(v) => {
              sendGAEvent({
                event: "select_quizset",
                value: v.target.value,
              });
              updateQuizSetting({
                setName: v.target.value,
                offset: quiz.offset,
              });
            }}
            w="auto"
            disabled={isPending}
          >
            <option value="">問題を表示しない</option>
            {quizset_names.map((setname) => (
              <option key={setname} value={setname}>
                {setname}
              </option>
            ))}
          </NativeSelect>
          {quiz.setName !== "" && (
            <NumberInput
              label="オフセット"
              description="セットの何問目から開始するかを指定します。"
              min={0}
              onChange={(n) => {
                updateQuizSetting({
                  setName: quiz.setName,
                  offset: typeof n === "string" ? parseInt(n, 10) || 0 : n || 0,
                });
              }}
              value={quiz.offset}
              disabled={isPending}
            />
          )}
        </>
      ) : (
        <ButtonLink leftSection={<IconUpload />} href="/quizes" disabled={isPending}>
          問題データを読み込む
        </ButtonLink>
      )}
    </>
  );
};

export default SelectQuizset;
