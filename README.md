# score-watcher-plus

![version](https://img.shields.io/github/package-json/v/newt239/next-score-watcher?style=flat)

<img
  src="https://raw.githubusercontent.com/newt239/next-score-watcher/main/public/score-watcher-ogp.webp" 
  alt="Score Watcher"
/>

競技クイズにおけるプレイヤーの得点状況を可視化するための Web アプリケーションです。

現在 17 の形式に対応しており、スコアの表示や勝ち抜け / 敗退の情報だけでなく、問題文表示やスマートフォンでの表示も可能です。

https://plus.score-watcher.com/

## 特徴

- Google アカウントでログインして利用します。プレイヤー・問題・ゲームのデータはサーバーに保存されるため、どの端末からでも同じデータを扱えます。
- ゲームを公開設定にすると、認証なしでアクセスできる観戦モード（`/viewer/[game_id]`）で得点状況を共有できます。
- 問題セットを紐づけると、得点表示画面に問題文と答えを表示できます。
- Discord Webhook を設定すると、勝ち抜けやリセットのタイミングで通知を送信できます。
- フリー / プラスの 2 プランがあり、作成できるゲーム・プレイヤー・問題の件数と観戦ページのアクセス上限がプランごとに決まります。

## 利用に当たって

- 本アプリケーションは**非営利目的である限り**どなたでも自由に利用することができます。
  - 詳細は [商用利用に関するルール](https://plus.score-watcher.com/docs/for_commercial_use)をご確認ください。
- オープン大会等で利用される際は、[@newt239](https://twitter.com/newt239) までご報告をお願いします。
- この他機能リクエストや不具合の報告等についても Twitter や GitHub の Issue より受け付けます。

## ローカル環境での起動

### 起動に必要なもの

- Node.js (v24 以降)
- pnpm
- Turso（libSQL）のデータベース
- Google OAuth のクライアント ID / シークレット

### 環境変数

`.env.example` をコピーして `.env` を作成し、値を設定してください。

```env
# アプリのバージョン（アップデート告知モーダルの表示判定に使用）
NEXT_PUBLIC_APP_VERSION=
# アプリの公開URL（本番は https://plus.score-watcher.com）
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_TAG_ID=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
# Google OAuth（リダイレクトURIに ${NEXT_PUBLIC_APP_URL}/api/auth/callback/google を登録すること）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
BETTER_AUTH_SECRET=
# Stripe（未設定の場合は全ユーザーがフリープランとして扱われます）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRODUCT_PLUS=
# 観戦モードのボードキャッシュに使用するCloudflare KV
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_KV_NAMESPACE_ID=
CLOUDFLARE_KV_API_TOKEN=
```

### 起動方法

#### 1. 以下のコマンドを実行

```bash
pnpm install
pnpm run db:migrate
pnpm run dev
```

#### 2. ブラウザでアクセス

デフォルトではポート番号 3000 で起動します。

http://localhost:3000/

### テスト

```bash
pnpm run test        # ユニットテスト（スコア計算）
pnpm run playwright  # E2Eテスト
```

### 品質チェック

```bash
pnpm run codecheck   # typecheck / lint / format / stylelint / ls-lint / knip
```
