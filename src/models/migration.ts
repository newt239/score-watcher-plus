import { z } from "zod";

/** ローカル版のルール名 */
const LocalRuleSchema = z.enum([
  "normal",
  "nomx",
  "nomx-ad",
  "ny",
  "nomr",
  "nbyn",
  "nupdown",
  "divide",
  "swedish10",
  "backstream",
  "attacksurvival",
  "squarex",
  "z",
  "freezex",
  "endless-chance",
  "variables",
  "aql",
  "attack25",
]);

/** ローカル版の操作の種類 */
const LocalVariantSchema = z.enum([
  "correct",
  "wrong",
  "through",
  "mutiple_correct",
  "multiple_wrong",
  "skip",
  "blank",
]);

/** ローカル版のルールパラメータ。形式ごとに使うキーが異なるためすべてoptional */
const LocalRuleParamsSchema = z.object({
  correct_me: z.number().nullable().optional(),
  wrong_me: z.number().nullable().optional(),
  correct_other: z.number().nullable().optional(),
  wrong_other: z.number().nullable().optional(),
  win_point: z.number().nullable().optional(),
  lose_point: z.number().nullable().optional(),
  win_through: z.number().nullable().optional(),
  limit: z.number().nullable().optional(),
});

/** ローカル版のゲーム参加プレイヤー */
const LocalGamePlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  initial_correct: z.number().nullable().optional(),
  initial_wrong: z.number().nullable().optional(),
  base_correct_point: z.number().nullable().optional(),
  base_wrong_point: z.number().nullable().optional(),
});

/** ローカル版のゲーム */
const LocalGameSchema = LocalRuleParamsSchema.extend({
  id: z.string().min(1),
  name: z.string(),
  rule: LocalRuleSchema,
  players: z.array(LocalGamePlayerSchema),
  quiz: z.object({ set_name: z.string(), offset: z.number() }).nullable().optional(),
  discord_webhook_url: z.string().nullable().optional(),
  options: z
    .record(z.string(), z.union([z.boolean(), z.number(), z.string()]))
    .nullable()
    .optional(),
  editable: z.boolean().nullable().optional(),
  last_open: z.string().nullable().optional(),
});

/** ローカル版のプレイヤー */
const LocalPlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  text: z.string().nullable().optional(),
  belong: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

/** ローカル版のクイズ */
const LocalQuizSchema = z.object({
  id: z.string().min(1),
  n: z.number(),
  q: z.string(),
  a: z.string(),
  set_name: z.string().nullable().optional(),
});

/** ローカル版のログ */
const LocalLogSchema = z.object({
  id: z.string().min(1),
  game_id: z.string(),
  player_id: z.string(),
  variant: LocalVariantSchema,
  system: z.number().nullable().optional(),
  timestamp: z.string().nullable().optional(),
  available: z.number().nullable().optional(),
  detail: z
    .object({
      type: z.literal("attack25"),
      panel: z.number(),
      removed_panel: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

/** ローカル版から書き出した移行用JSONのスキーマ */
export const ImportLocalDataRequestSchema = z.object({
  meta: z
    .object({
      format: z.string().optional(),
      version: z.number().optional(),
      app_version: z.string().nullable().optional(),
      exported_at: z.string().optional(),
      profile: z.string().optional(),
    })
    .optional(),
  games: z.array(LocalGameSchema),
  players: z.array(LocalPlayerSchema),
  quizes: z.array(LocalQuizSchema),
  logs: z.array(LocalLogSchema),
});

/** ローカル版から書き出した移行用JSONの型 */
export type ImportLocalDataRequestType = z.infer<typeof ImportLocalDataRequestSchema>;

/** ローカル版のゲーム1件の型 */
export type LocalGameType = z.infer<typeof LocalGameSchema>;
