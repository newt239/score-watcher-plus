# AGENTS.md

このファイルは AI Agents がこのリポジトリで作業する際の具体的なガイダンスを提供します。

## 目次

- [原則](#原則)
- [プロジェクト概要](#プロジェクト概要)
- [主要技術](#主要技術)
- [コマンド一覧](#コマンド一覧)
- [ファイル構造とアーキテクチャ](#ファイル構造とアーキテクチャ)
- [コーディング規約](#コーディング規約)
- [リポジトリ設定](#リポジトリ設定)
- [AGENTS.md更新ルール](#agentsmd更新ルール)

## 原則

### 日本語による応答

ユーザーとのコミュニケーションやコミットメッセージ、コメント、ログ、ドキュメントは**すべて日本語で記述**してください。

### 確認必須

機能や実装について少しでも不明点があれば必ず質問してください。

### codecheckの実行

実装後の必須作業として、以下のコマンドを実行してください。

```bash
pnpm run codecheck
```

`codecheck` は typecheck / lint / format / stylelint / ls-lint / knip を順に実行します。エラーが出た場合は、コミット前に必ず修正してください。エラーを解消するために各種設定ファイル（tsconfig, .oxlintrc.json 等）を緩めるのは禁止です。

### 定期的なコミット

適切な粒度でコミットを行ってください。コミットメッセージは`prefix: message`の形式で記述してください。1行で完結するようにしてください。

### ドキュメントの更新

ユーザーとの会話で新しくプロジェクト全体に共通するルールが指示された場合は、まず`AGENTS.md`を更新してください。

ドキュメントを追加するよう指示があった場合は`docs`以下にMarkdownファイルを作成して記述してください。

## プロジェクト概要

Score Watcher は競技クイズのスコア可視化Webアプリケーションです。**React Router v8（framework mode）** で実装し、**Cloudflare Workers** にデプロイしています。

プレイデータはすべてサーバー（Turso DB）に保存されます。Googleアカウントでログインして利用し、ゲームを公開設定にすると認証なしの観戦モード（`/viewer/:game_id`）で誰でも観戦できます。

### ルーティング

ルートは **`src/routes.ts` の設定ベース**で定義します（ファイル名からの自動生成ではありません）。ルートを追加する際は `src/routes.ts` に `route()` / `index()` / `layout()` / `prefix()` で追記してください。

ルートモジュールのファイル名は `route.tsx`（ページ）と `layout.tsx`（レイアウト）に統一しています。`_components` / `_hooks` はルートモジュールの隣にそのまま置けます（設定ベースなのでルートとして解釈されません）。

- `/` … トップページ（LP、認証不要）
- `/sign-in` … ログイン（認証不要）
- `/rules` … 形式一覧（認証不要。ゲーム作成にはログインが必要）
- `/games`, `/players`, `/quizes`, `/user` … 認証必須（`src/routes/default/authed/` 配下）
- `/games/:game_id/board` … スコアボード（認証必須）
- `/viewer/:game_id` … 観戦モード（認証不要、公開ゲームのみ）
- `/docs` … アプリ情報（認証不要）

旧URL `/online/*` は `workers/app.ts` で新URLへ301リダイレクトされます。

### 認証ガード

認証ガードは React Router の **middleware**（`src/middleware/auth.ts` の `authMiddleware`）で行います。ガードを通ったユーザーは `userContext`（`src/context.ts`）に載るので、loader からは `context.get(userContext)` で取得してください。

- `src/routes/default/authed/layout.tsx` … 認証必須グループ全体を保護
- `src/routes/board/board/route.tsx` … 上記グループの配下ではないため、このルートに個別に `middleware` を付与
- API側は各コントローラーが `getUserId(c.req.raw.headers)` で認証確認

## 主要技術

### フロントエンド

**React Router v8（framework mode）** を **Vite** 上で使用し、TypeScriptで記述します。React Server Components は使用しません（React Router の RSC サポートは experimental のため採用していません）。したがって `"use client"` は不要で、書いてはいけません。

**データ取得について:**

- **初期データ取得**: ルートモジュールの `loader` で行い、`loaderData` としてコンポーネントへ渡してください
- **loader からは `src/server/repositories/` を直接呼んでよい**です。HTTPの往復が無くなるため、画面の初期表示ではこちらを使ってください
- **クライアントからの更新・再取得**: `createApiClient()`（`@/utils/hono/browser`）でHono RPC経由のAPIを呼んでください。**コンポーネントから `repositories` を直接呼ぶことは禁止**です（呼んでよいのは loader / action / Honoのコントローラーだけ）
- **useEffect**: データ取得には使用しないでください。ブラウザAPIアクセスやイベントリスナー登録など、真に必要な場合のみ使用を許可します
- **型アサーションの使用禁止**: 安易に型アサーションを使用しないでください。APIレスポンスは型を信頼し、そのまま受け入れてください
- **日付の扱い**: リポジトリは `Date` を返しますが、コンポーネントの型はAPIレスポンスに合わせた文字列形式（`SeriarizedGame` など）です。loader で返す際は `serializeGameForCompute()`（`@/server/utils/board-data`）などでISO文字列へ揃えてください
- **日時の表示**: SSRとブラウザでタイムゾーンがずれてハイドレーションが壊れるため、`formatDisplayDate()`（`@/utils/date`）を使ってください。`cdate().format()` の直接呼び出しは禁止です

ルート更新後に画面を再取得したい場合は `useRevalidator().revalidate()`、遷移は `useNavigate()` を使用します。

Reactのガイドも参考にしてください：
https://react.dev/learn/you-might-not-need-an-effect

### スタイリング

UIコンポーネントライブラリの一つである**Mantine**を使用します。新しいUIを実装する際はまずMantineのコンポーネントの使用を検討してください。

デザインのカスタマイズは**CSS Modules**を使用してください。**Tailwind CSSは使用禁止**とします。クラス名はsnake_caseで命名してください（css-modules-kit がJavaScript識別子として扱えない名前をサポートしないため、kebab-caseは使用禁止）。

### データベース

データは**Turso（libSQL）**に保存し、**Drizzle ORM**で操作します。

- スキーマ定義: `src/utils/drizzle/schema/`（`auth.ts`, `game.ts`, `quiz.ts`）
- 接続クライアント: `src/utils/drizzle/client.ts`
- データベース操作は`src/server/repositories/`以下の関数で行い、必ず`userId`で本人スコープを強制してください

観戦モードのボードデータは**Cloudflare KV**（`src/utils/cache/`）でキャッシュされます。KVはREST APIではなく `wrangler.jsonc` の `BOARD_CACHE` バインディング経由でアクセスします（`import { env } from "cloudflare:workers"`）。

### 認証

**better-auth**（`src/utils/auth/auth.ts`）を使用します。本番はGoogle OAuth、非本番環境ではE2Eテスト用のEmail/Password認証も有効です。サーバー側でのユーザー取得は`src/utils/auth/auth-helpers.ts`の`getUser(headers)`を使用してください（`Headers`を引数で渡します）。

### デプロイ先

**Cloudflare Workers** です。エントリは `workers/app.ts` で、`/api/*` をHonoへ、それ以外を React Router のリクエストハンドラへ振り分けています。

- 環境判定は `process.env.NODE_ENV` ではなく **`import.meta.env.PROD`** を使ってください。Workers上では `process.env.NODE_ENV` が未定義になり、本番でE2E用エンドポイントが開いてしまいます
- クライアントに埋め込む環境変数は **`VITE_` プレフィックス**が必須です（ビルド時に静的置換されます）。サーバー専用のシークレットはプレフィックス無しで `wrangler secret put` に登録します
- Cloudflareのバインディングは `context.get(cloudflareContext)`（`src/context.ts`）から参照できます

## コマンド一覧

### 基本コマンド

```bash
pnpm install          # 依存関係のインストール
pnpm run dev          # Vite開発サーバー起動 (localhost:3000)
pnpm run build        # プロダクションビルド
pnpm run preview      # ビルドして実workerd(wrangler dev)で起動 (localhost:8787)
pnpm run deploy       # ビルドしてCloudflare Workersへデプロイ
pnpm run cf-typegen   # wrangler.jsoncからEnv型を生成（バインディング変更時に実行）
```

`pnpm run dev` はVite上でも Workers ランタイムを使うため本番に近い挙動になりますが、Node と workerd の差で dev だけ通るケースがあります。**ランタイム挙動に関わる変更をしたときは `pnpm run preview` でも確認してください。**

### 品質管理

```bash
pnpm run codecheck     # typecheck + lint + format + stylelint + ls-lint + knip を一括実行
pnpm run typecheck     # React Routerの型生成 + TypeScript型チェック
pnpm run lint          # oxlint
pnpm run lint:fix
pnpm run format        # oxfmt（importソート含む）
pnpm run format:fix
pnpm run stylelint     # CSSのlint
pnpm run stylelint:fix
pnpm run ls-lint       # ファイル名の命名規則チェック
pnpm run knip          # 未使用ファイル・依存・エクスポートの検出
pnpm run gen           # CSS Modules Kitによる型生成
```

### データベース

```bash
pnpm run db:generate   # データベーススキーマ生成
pnpm run db:migrate    # データベースマイグレーション
pnpm run db:studio     # データベーススキーマ確認
pnpm run db:push       # データベーススキーマをデプロイ
```

### テスト実行

```bash
pnpm run test         # Vitest ユニットテスト（src/**/*.test.ts）
pnpm run vitest       # Vitest（watchモード）
pnpm run playwright   # Playwright E2E テスト
```

E2Eテスト（`tests/online-game.spec.ts`）は開発サーバー経由で実際のTurso DBに接続します。ローカル実行には`.env`にTurso・better-auth関連の環境変数が必要です。テストログインは`/api/e2e/test-login`（本番ビルドでは403で無効）を使用します。

## ファイル構造とアーキテクチャ

### ディレクトリ構成

```bash
workers/
└── app.ts                 # Workerのエントリ（Honoのマウント・旧URLリダイレクト・Sentry）
src/
├── routes.ts              # ルート定義（設定ベース）
├── root.tsx               # ルートレイアウト（Mantine・meta・Scripts）
├── entry.client.tsx       # クライアントエントリ（Sentry初期化）
├── context.ts             # loader/middleware間で共有するコンテキスト
├── globals.css            # グローバルスタイル
├── middleware/            # React Routerのmiddleware（認証ガード）
├── routes/
│   ├── board/             # スコアボード・観戦ページ群（全画面レイアウト）
│   │   ├── board/         # スコアボード（認証必須）
│   │   └── viewer/        # 観戦モード（認証不要）
│   └── default/           # 通常レイアウトのページ群
│       ├── authed/        # 認証必須ページ（games, players, quizes, user）
│       ├── rules/         # 形式一覧（公開）
│       ├── sign-in/       # ログイン
│       ├── docs/          # アプリ情報
│       └── _components/   # 通常レイアウト共有コンポーネント
├── assets/                # 画像などの静的アセット
├── components/            # 汎用UIコンポーネント（ButtonLink, Link等）
├── models/                # Zodスキーマと型定義（機能ごと）
│   ├── game.ts            # ゲーム関連
│   ├── player.ts          # プレイヤー関連
│   ├── quiz.ts            # クイズ関連
│   └── user-preference.ts # ユーザー設定関連
├── server/                # サーバーサイド実装
│   ├── controllers/       # APIハンドラー（機能別ディレクトリ）
│   │   ├── game/          # ゲーム関連エンドポイント
│   │   ├── player/        # プレイヤー関連エンドポイント
│   │   ├── quiz/          # クイズ関連エンドポイント
│   │   ├── user/          # ユーザー関連エンドポイント
│   │   ├── viewer/        # 観戦者関連エンドポイント
│   │   └── e2e/           # E2Eテスト用エンドポイント（非本番のみ）
│   ├── repositories/      # データベース操作層
│   ├── utils/             # サーバー専用ユーティリティ
│   └── index.ts           # Honoアプリのエントリーポイント
├── utils/
│   ├── auth/              # 認証関連ユーティリティ（better-auth）
│   ├── cache/             # Cloudflare KVキャッシュ管理（観戦用）
│   ├── drizzle/           # Drizzle ORM設定・スキーマ
│   ├── hono/              # Honoクライアント設定
│   ├── online/            # ドメインロジック
│   │   ├── computeScore/  # 18種類のゲーム形式の計算ロジック
│   │   └── discord.ts     # Discord Webhook通知
│   ├── types.ts           # TypeScript型定義
│   ├── functions.ts       # 共通ユーティリティ関数
│   ├── rules.ts           # ゲームルール定義
│   └── theme.ts           # Mantineテーマ設定
└── instrumentation.ts     # Sentry計測設定
```

### スコア計算システム

各形式のロジックは`docs/rules`以下に仕様書があります。

**ファイル場所:** `src/utils/online/computeScore/`（エントリは`computeOnlineScore.ts`）

**対応ゲーム形式:**

- normal, nomx, ny, swedish, backstream, z, aql, attack25, linear等の18形式
- 各形式は独立したファイルで実装
- 共通インターフェースを使用して統一的に処理
- テストは`src/utils/online/computeScore/__tests__/`にあり、`pnpm run test`で実行

## コーディング規約

### TypeScript規約

- 原則としてアロー関数を使用してください。
- コンポーネントは原則として`default`でexportしてください。
- 決して`any`を使用しないでください。
- 型定義には `type`を使用してください。`interface`は禁止です（例外は`src/vite-env.d.ts`の`ImportMetaEnv`だけで、宣言マージのためにinterfaceが必須です）。
- 原則として型アサーションを使用しないでください。使用する場合は明確な理由が必要です。
- パスエイリアスは`@/`で`src/`を参照してください。
- CSS Modulesは自動生成されたTypeScript定義を使用してください。
- テストは原則としてVitestを使用してください。
- 関数を定義する際は必ずJSDocを記述してください。また、関数の返り値やAPIの返り値は必ず`as const`を使用してください。
- エラーを解消するためにoxlintのルールを変更するのは禁止です。

### スタイリング規約

- CSS ModulesはPostCSS + Mantine プリセット使用してください。
- プロパティ順序はStylelintのrecess-orderに従ってください。
- レスポンシブはモバイルファーストで実装してください。
- クラス名はsnake_caseで命名してください。

### ファイル作成・編集ルール

1. 新しいコンポーネント作成時:
   - 既存コンポーネントのパターンを確認
   - 同じディレクトリ内の命名規則に従う（`.ls-lint.yml`でチェックされます）
   - CSS Modulesファイルも合わせて作成

2. ユーティリティ関数追加時:
   - `src/utils/functions.ts`に追加するか検討
   - 型定義は`src/utils/types.ts`で管理

3. ゲームロジック変更時:
   - `src/utils/online/computeScore/`内の対応ファイルを編集
   - テストファイルも合わせて更新

4. ルート追加時:
   - ルートモジュールを`src/routes/`以下に`route.tsx`（または`layout.tsx`）として作成
   - `src/routes.ts`に登録
   - 型は`import type { Route } from "./+types/route";`で受け取る（`pnpm run typecheck`で自動生成されます）
   - ページタイトルは`meta`をexportして設定します。**`meta`は親ルートのものを上書きするため、タイトルが必要なルートでは必ず`{ title: ... }`を含めてください**

### API Routes（Hono）

クライアントからのデータ更新・再取得はすべてHonoのAPI Routesで実装します（画面の初期データはルートの`loader`が担当します）。

- API RoutesのルートはすべてHonoで管理します
- エントリーポイントは`src/server/index.ts`で管理します
- ルートを追加する際は`src/server/index.ts`に追加してください
- コントローラーの実装は`src/server/controllers/`に追加してください
- **バリデーションには必ず`zValidator`を使用**してください（リクエストボディ、クエリパラメータ両方）
- **バリデーションスキーマは`src/models/`で定義**し、UpperCamelCaseで命名してください
- データベースとのやり取りは`repositories`以下で行ってください
- **APIクライアント**: クライアントサイドでは`createApiClient()`（`@/utils/hono/browser`）を使用してください。生のfetchは使用しないでください。サーバーサイド（loader）からAPIをHTTPで呼ぶことはせず、`repositories`を直接呼びます

**バリデーション実装例:**

```typescript
import { zValidator } from "@hono/zod-validator";
import { GetPlayersQuerySchema } from "@/models/players";

const handler = factory.createHandlers(
  zValidator("query", GetPlayersQuerySchema), // クエリパラメータ
  zValidator("json", CreatePlayerSchema), // リクエストボディ
  async (c) => {
    const query = c.req.valid("query");
    const body = c.req.valid("json");
    // 処理...
  }
);
```

**Controllers構成ルール:**

- `src/server/controllers/`以下のハンドラーは1ファイルにつき1個とします
- 機能ごとにディレクトリを分割してください（`game/`, `player/`, `user/`, `viewer/`など）
- ファイル名はメソッドタイプ-機能名の形式で命名してください
  - 例: `game/get-list.ts`, `game/post-create.ts`, `game/get-detail.ts`, `game/patch-update.ts`
  - 例: `player/get-list.ts`, `player/post-create.ts`
  - 例: `user/get-preferences.ts`, `user/update-preferences.ts`
- 各ファイルでは`default export`でハンドラーをエクスポートしてください
- `src/server/index.ts`でimportして使用してください
- **必ず`factory.createHandlers`を使用してください**: 既存の実装パターンに合わせて、すべてのハンドラーで`createFactory()`から生成したfactoryの`createHandlers`メソッドを使用してください
- **既存ファイルとの統合を優先**: 新しい機能を実装する際は、新しいファイルを作成するのではなく、既存の同種ファイル（例：`models/player.ts`、`repositories/player.ts`）に機能を追加してください

### Models管理

サーバーサイドの型定義とスキーマ定義は`src/models/`で機能ごとに管理してください。

**使用ルール:**

- 各機能のZodスキーマは対応するmodelsファイルで定義してください
- スキーマ名は**UpperCamelCase**で命名してください（例：`CreateGameSchema`, `UpdateUserPreferencesSchema`）
- 各エンドポイントのリクエストを定義するスキーマや型名は、先頭をCRUDの動詞にしたうえで、リクエストのスキーマなのか、レスポンスのスキーマなのかを明示してください（例：`CreateGameRequestSchema`, `UpdateUserPreferencesResponseType`）
- TypeScriptの型定義もmodelsファイルで管理してください
- Controllers・Repositoriesからmodelsファイルを`@/models/`でimportして使用してください
- バリデーションスキーマと型定義を同じファイルで管理することで、保守性を向上させてください
- 新しい機能を追加する際は、対応するmodelsファイルを作成してください
- **データ変換関数の禁止**: modelsディレクトリには型とスキーマのみ配置してください。レスポンスデータを変換する関数は作成しないでください。APIレスポンスはそのまま受け入れてください

### ローディング表示

- APIリクエストを行う際は`useTransition`を使用してローディング表示を行ってください。
- ボタンを連打できないように`disabled`を設定してください。

### ルートの実装パターン

```typescript
import { userContext } from "@/context";
import { getPlayers } from "@/server/repositories/player";

import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = () => [{ title: "プレイヤー管理 - Score Watcher" }];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  return { initialPlayers: await getPlayers(user.id) } as const;
};

const PlayersPage = ({ loaderData }: Route.ComponentProps) => {
  return <PlayersComponent initialPlayers={loaderData.initialPlayers} />;
};

export default PlayersPage;
```

※ 認証必須グループ配下は layout の `middleware` がガードするため、各ルートでの認証チェックは不要です。`context.get(userContext)` は必ずユーザーを返します。

データ取得に失敗した／対象が見つからない場合は `throw data(null, { status: 404 })` を使い、表示は `ErrorBoundary` に任せてください。

### 型定義パターン

```typescript
// APIレスポンス専用の型を定義（createdAt/updatedAtはstring）
export type ApiDataType = {
  id: string;
  name: string;
  createdAt?: string; // API responseは常にstring
  updatedAt?: string;
};
```

## リポジトリ設定

- **Node.js**: バージョンは`.node-version`（mise利用時は`mise.toml`）で固定。CIも`node-version-file`を参照
- **フォーマット**: oxfmt（`.oxfmtrc.json`）。importソート・package.jsonのscriptsソート・JSDoc整形が有効
- **Lint**: oxlint（`.oxlintrc.json`、type-aware）
- **ファイル名規則**: ls-lint（`.ls-lint.yml`）
- **未使用コード検出**: knip（`knip.json`）。未使用エクスポート・型は警告扱いでベースライン化中
- **pre-commitフック**: lefthook（`lefthook.yml`）で lint:fix / format:fix / stylelint:fix / ls-lint を実行
- **CI**: `.github/workflows/codecheck.yml`（typecheck/lint/format/stylelint/ls-lint/knip）、`playwright.yml`（E2E）、`actionlint.yml`、`dependabot.yml`による週次依存更新と自動マージ
- **デプロイ**: **Cloudflare Workers Builds**（CloudflareダッシュボードでGit連携）。`release`ブランチへのpushで本番（`plus.score-watcher.com`）へ自動デプロイされます。GitHub Actionsのデプロイworkflowは使いません。手元から手動でデプロイする場合は `pnpm run deploy`
- **本番の設定**: Workerランタイムのシークレット（`TURSO_*` / `BETTER_AUTH_SECRET` / `GOOGLE_*` / `STRIPE_*`）は `wrangler secret put` で登録済み。ビルド時にクライアントへ埋め込む `VITE_APP_URL` は Workers Builds のビルド変数に設定します
- **ビルド**: Vite（`vite.config.ts`）。pnpm構成ではSSRの依存最適化でReactが二重に読み込まれてフックが壊れるため、`resolve.dedupe` の指定を外さないこと
- **Workers設定**: `wrangler.jsonc`。バインディングを変更したら `pnpm run cf-typegen` で `worker-configuration.d.ts` を再生成すること。`BOARD_CACHE`（KV）とカスタムドメイン`plus.score-watcher.com`を定義済み
- **パッケージ**: ESM-only（`package.json`の`"type": "module"`）。React Router v8 と Cloudflare の各プラグインがESM専用のため外さないこと

## AGENTS.md更新ルール

プロジェクト全体に影響する新しいルールや設定が決まった場合：

- このファイルの該当セクションに具体的に記載
- 抽象的表現は避け、実行可能な形で記述
- 将来のセッションで再現可能な内容にする
