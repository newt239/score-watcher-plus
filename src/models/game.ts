import { z } from "zod";

import { type SeriarizedGameLog, type TypedGame } from "@/utils/drizzle/types";

/** ルール名の型定義 */
export type RuleNames =
  | "normal"
  | "nomx"
  | "nomx-ad"
  | "ny"
  | "nomr"
  | "nbyn"
  | "nupdown"
  | "divide"
  | "swedish10"
  | "backstream"
  | "attacksurvival"
  | "squarex"
  | "z"
  | "freezex"
  | "endless-chance"
  | "variables"
  | "aql"
  | "attack25";

/** 操作の種類の型定義 */
export type Variants =
  | "correct"
  | "wrong"
  | "through"
  | "mutiple_correct"
  | "multiple_wrong"
  | "skip"
  | "blank";

/** プレイヤーの状態の型定義 */
export type States = "win" | "lose" | "playing";

/** 計算されたスコアの型定義 */
export type ComputedScoreProps = {
  game_id: string;
  player_id: string;
  state: States;
  reach_state: States;
  score: number;
  correct: number; // 正解数
  wrong: number; // 誤答数
  last_correct: number; // 最後に正解した問題番号
  last_wrong: number; // 最後に誤答した問題番号
  odd_score: number; // 奇数問目のスコア
  even_score: number; // 偶数問目のスコア
  stage: number;
  is_incapacity: boolean;
  order: number; // プレイヤー同士の評価順
  text: string; // 画面上に表示するための文字
};

/** オンライン版でのログDB型（ローカル版の LogDBProps に相当） */
export type LogDBProps = {
  id: string;
  game_id: string;
  player_id: string;
  variant: Variants;
  system: 0 | 1;
  timestamp: string;
  available: 0 | 1;
};

export type PlayerProps = {
  id: string;
  name: string;
  description: string;
  affiliation: string;
  tags: string[];
};

export type GamePlayerProps = {
  id: string;
  name: string;
  description: string;
  affiliation: string;
  displayOrder: number;
  initialScore: number | null;
  initialCorrectCount: number | null;
  initialWrongCount: number | null;
  /** Variables形式でプレイヤーごとに設定する変動値N */
  baseCorrectPoint: number;
};

/** ゲーム詳細取得のレスポンスの型 */
export type GetGameDetailResponseType = TypedGame & {
  isPublic: boolean;
  players: GamePlayerProps[];
  logs: SeriarizedGameLog[];
};

/** ゲーム作成の基本スキーマ */
export const CreateGameSchema = z.object({
  name: z.string().min(1),
  ruleType: z.string() as z.ZodSchema<RuleNames>,
  discordWebhookUrl: z.string().optional(),
  option: z.unknown().optional(),
});

/** 既存ゲームからプレイヤーをコピーするリクエストスキーマ */
export const CopyPlayersFromGameRequestSchema = z.object({
  sourceGameId: z.string().min(1),
});

/** ゲーム作成リクエストのスキーマ */
export const CreateGameRequestSchema = z
  .array(CreateGameSchema)
  .min(1, "最低1つのゲームが必要です");

/** プレイヤー設定更新のスキーマ */
export const UpdateGamePlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayOrder: z.number().int().min(0),
  initialScore: z.number().int().default(0),
  initialCorrectCount: z.number().int().default(0),
  initialWrongCount: z.number().int().default(0),
  baseCorrectPoint: z.number().int().min(1).default(1),
});

/** ゲームプレイヤー更新リクエストのパラメータスキーマ */
export const UpdateGamePlayerRequestParamSchema = z.object({
  gamePlayerId: z.string().min(1),
});

/** ゲームプレイヤー更新リクエストのjsonスキーマ */
export const UpdateGamePlayerRequestJsonSchema = z.union([
  z.object({
    key: z.literal("displayOrder"),
    value: z.number().int().min(0),
  }),
  z.object({
    key: z.literal("initialScore"),
    value: z.number().int(),
  }),
  z.object({
    key: z.literal("initialCorrectCount"),
    value: z.number().int().min(0),
  }),
  z.object({
    key: z.literal("initialWrongCount"),
    value: z.number().int().min(0),
  }),
  z.object({
    key: z.literal("baseCorrectPoint"),
    value: z.number().int().min(1),
  }),
]);

/** ゲームプレイヤー一括更新リクエストのパラメータスキーマ */
export const UpdateGamePlayersRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲームプレイヤー一括更新リクエストのjsonスキーマ */
export const UpdateGamePlayersRequestJsonSchema = z.object({
  players: z.array(UpdateGamePlayerSchema),
});

/** クイズ設定更新のスキーマ（setNameが空文字の場合は問題を表示しない） */
export const UpdateGameQuizSchema = z.object({
  setName: z.string(),
  offset: z.number().int().min(0).default(0),
});

/** クイズ設定の型 */
export type GameQuizType = z.infer<typeof UpdateGameQuizSchema>;

/** 得点表示画面で表示する問題の型 */
export type BoardQuizType = {
  question: string;
  answer: string;
};

/** ゲーム更新リクエストのスキーマ */
export const UpdateGameRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲーム更新リクエストのjsonスキーマ */
export const UpdateGameRequestJsonSchema = z.union([
  z.object({
    key: z.union([z.literal("name"), z.literal("discordWebhookUrl")]),
    value: z.string(),
  }),
  z.object({
    key: z.literal("option"),
    value: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  }),
  z.object({
    key: z.literal("isPublic"),
    value: z.boolean(),
  }),
  z.object({
    key: z.literal("quiz"),
    value: UpdateGameQuizSchema,
  }),
  z.object({
    key: z.literal("editable"),
    value: z.boolean(),
  }),
]);

/** ゲーム削除リクエストのスキーマ */
export const DeleteGameRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲームログ更新リクエストのパラメータスキーマ */
export const UpdateGameLogRequestParamSchema = z.object({
  logId: z.string().min(1),
});

/** ゲームログ更新リクエストのjsonスキーマ（playerIdはカンマ区切りで複数指定できる） */
export const UpdateGameLogRequestJsonSchema = z.object({
  playerId: z.string().min(1),
});

/** ゲームログ一括削除（リセット）リクエストのパラメータスキーマ */
export const ResetGameLogsRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲームインポートで受け取るプレイヤーのスキーマ */
const ImportGamePlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  affiliation: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0),
  initialScore: z.number().int().nullable().optional(),
  initialCorrectCount: z.number().int().nullable().optional(),
  initialWrongCount: z.number().int().nullable().optional(),
  baseCorrectPoint: z.number().int().min(1).optional(),
});

/** ゲームインポートで受け取るログのスキーマ */
const ImportGameLogSchema = z.object({
  playerId: z.string().nullable().optional(),
  actionType: z.string() as z.ZodSchema<Variants>,
  questionNumber: z.number().int().nullable().optional(),
  scoreChange: z.number().int().nullable().optional(),
  isSystemAction: z.boolean().nullable().optional(),
  panel: z.number().int().nullable().optional(),
  removedPanel: z.number().int().nullable().optional(),
  timestamp: z.string().optional(),
});

/** ゲームインポートリクエストのスキーマ（エクスポートしたJSONの形式に対応） */
export const ImportGameRequestSchema = z.object({
  data: z.object({
    name: z.string().min(1),
    ruleType: z.string() as z.ZodSchema<RuleNames>,
    option: z.unknown().optional(),
    discordWebhookUrl: z.string().nullable().optional(),
    quizSetName: z.string().nullable().optional(),
    quizOffset: z.number().int().min(0).optional(),
    players: z.array(ImportGamePlayerSchema),
    logs: z.array(ImportGameLogSchema),
  }),
});

/** ゲームインポートリクエストの型 */
export type ImportGameRequestType = z.infer<typeof ImportGameRequestSchema>;

/** ゲームにプレイヤー追加リクエストのスキーマ */
export const AddPlayerToGameRequestSchema = z.object({
  playerId: z.string().min(1),
  displayOrder: z.number().int().min(0),
  initialScore: z.number().int().default(0).optional(),
  initialCorrectCount: z.number().int().default(0).optional(),
  initialWrongCount: z.number().int().default(0).optional(),
});

/** ゲームプレイヤー削除リクエストのスキーマ */
export const RemoveGamePlayersRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲームプレイヤー削除リクエストのJSONスキーマ */
export const RemoveGamePlayersRequestJsonSchema = z.object({
  playerIds: z.array(z.string().min(1)).min(1, "削除するプレイヤーIDが必要です"),
});

/** ゲームログ追加リクエストのスキーマ */
export const AddGameLogRequestSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  questionNumber: z.number().int().optional(),
  actionType: z.string() as z.ZodSchema<Variants>,
  scoreChange: z.number().int().default(0),
  isSystemAction: z.boolean().default(false),
  // アタック25で獲得したパネル番号(0-24)
  panel: z.number().int().min(0).max(24).optional(),
  // アタック25のアタックチャンスで消去したパネル番号(0-24)
  removedPanel: z.number().int().min(0).max(24).optional(),
});

/** ゲーム作成リクエストの型 */
export type CreateGameRequestType = z.infer<typeof CreateGameRequestSchema>;

/** プレイヤー設定更新の型 */
export type UpdateGamePlayerType = z.infer<typeof UpdateGamePlayerSchema>;

/** ゲーム更新リクエストの型 */
export type UpdateGameRequestJsonType = z.infer<typeof UpdateGameRequestJsonSchema>;

/** ゲームプレイヤー更新リクエストのjson型 */
export type UpdateGamePlayerRequestJsonType = z.infer<typeof UpdateGamePlayerRequestJsonSchema>;

/** ゲームにプレイヤー追加リクエストの型 */
export type AddPlayerToGameRequestType = z.infer<typeof AddPlayerToGameRequestSchema>;

/** ゲームログ追加リクエストの型 */
export type AddGameLogRequestType = z.infer<typeof AddGameLogRequestSchema>;

/** ゲームオプション更新リクエストのスキーマ */
export const UpdateGameOptionsRequestParamSchema = z.object({
  gameId: z.string().min(1),
});

/** ゲームオプション更新リクエストのjsonスキーマ */
export const UpdateGameOptionsRequestJsonSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

/** ゲームプレイヤー削除レスポンスの型 */
export type RemoveGamePlayersResponseType = {
  removed: boolean;
  deletedCount: number;
  message: string;
};

/** オンラインゲームログ情報の型（API専用） */
export type OnlineGameLogType = {
  id: number | string;
  player_id: string;
  variant: Variants;
  system: number;
  available: number;
  createdAt?: string;
  updatedAt?: string;
};

/** オンラインユーザー情報の型（API専用） */
export type OnlineUserType = {
  id: string;
  name: string;
  email: string;
};

/** Viewer用ボードデータ取得パラメータスキーマ */
export const GetViewerBoardDataParamSchema = z.object({
  gameId: z.string().min(1),
});

/** 観戦モードで表示するプレイヤー（スコア計算結果に表示用の情報を加えたもの） */
export type ViewerPlayerType = ComputedScoreProps & {
  name: string;
  affiliation: string;
};

/** Viewer用ボードデータレスポンス型 */
export type GetViewerBoardDataResponseType = {
  game: {
    id: string;
    name: string;
    ruleType: RuleNames;
    isPublic: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  players: ViewerPlayerType[];
  logs: OnlineGameLogType[];
  /** アタック25の盤面（各パネルの保持プレイヤーID、空きはnull）。attack25のみ設定される */
  attack25Board?: (string | null)[];
};
