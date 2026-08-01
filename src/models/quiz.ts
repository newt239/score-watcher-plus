import { z } from "zod";

/** クイズ問題作成の基本スキーマ */
export const CreateQuizSchema = z.object({
  question: z.string().min(1, "問題文は必須です"),
  answer: z.string().min(1, "答えは必須です"),
  annotation: z.string().optional().default(""),
  category: z.string().optional().default(""),
  setName: z.string().min(1, "セット名は必須です"),
  questionNumber: z.number().int().min(1, "問題番号は1以上である必要があります"),
});

/** クイズ問題作成リクエストのスキーマ */
export const CreateQuizRequestSchema = z
  .array(CreateQuizSchema)
  .min(1, "最低1つのクイズ問題が必要です");

/** クイズ問題更新の基本スキーマ */
export const UpdateQuizSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, "問題文は必須です").optional(),
  answer: z.string().min(1, "答えは必須です").optional(),
  annotation: z.string().optional(),
  category: z.string().optional(),
  setName: z.string().min(1, "セット名は必須です").optional(),
  questionNumber: z.number().int().min(1, "問題番号は1以上である必要があります").optional(),
});

/** クイズ問題更新リクエストのスキーマ */
export const UpdateQuizRequestSchema = z
  .array(UpdateQuizSchema)
  .min(1, "最低1つのクイズ問題が必要です");

/** クイズ問題削除リクエストのスキーマ */
export const DeleteQuizRequestSchema = z
  .array(z.string().min(1))
  .min(1, "最低1つのクイズ問題IDが必要です");

/** クイズ問題取得クエリのスキーマ */
export const GetQuizzesQuerySchema = z.object({
  setName: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
});

/** クイズ問題作成の基本型 */
export type CreateQuizType = z.infer<typeof CreateQuizSchema>;

/** クイズ問題作成リクエストの型 */
export type CreateQuizRequestType = z.infer<typeof CreateQuizRequestSchema>;

/** クイズ問題更新リクエストの型 */
export type UpdateQuizRequestType = z.infer<typeof UpdateQuizRequestSchema>;

/** クイズ問題削除リクエストの型 */
export type DeleteQuizRequestType = z.infer<typeof DeleteQuizRequestSchema>;

/** APIレスポンス用のクイズ問題型 */
export type ApiQuizType = {
  id: string;
  question: string;
  answer: string;
  annotation?: string;
  category?: string;
  setName: string;
  questionNumber: number;
  createdAt?: string;
  updatedAt?: string;
};

// レガシー互換性のためのエイリアス
export type ApiQuizDataType = ApiQuizType;
export type GetQuizesListResponseType = {
  quizes: ApiQuizType[];
  total: number;
};
