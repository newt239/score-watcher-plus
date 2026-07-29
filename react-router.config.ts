import type { Config } from "@react-router/dev/config";

export default {
  // ルートモジュールは src/ 配下に置く（src/root.tsx, src/routes.ts）
  appDirectory: "src",
  // 全ページがユーザー固有のデータを扱うためSSRを有効にする
  ssr: true,
} satisfies Config;
