import { z } from "zod";

/** テスト用ログインリクエストスキーマ */
export const TestLoginRequestSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上である必要があります"),
});
