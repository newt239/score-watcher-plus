import { cdate } from "cdate";

import { serializeGameForCompute } from "@/server/utils/board-data";
import { getAppBaseUrl } from "@/utils/app-url";

import { computeOnlineScore } from "./computeScore/computeOnlineScore";

import type { GameWithRelations } from "@/server/utils/board-data";

/**
 * Discord Webhookによる勝ち抜け通知を送信する
 *
 * @param gameData リポジトリから取得したゲームデータ
 */
export async function sendDiscordWinnerNotification(gameData: GameWithRelations): Promise<void> {
  // Discord Webhook URLが設定されていない場合は何もしない
  if (!gameData.discordWebhookUrl?.startsWith("https://discord.com/api/webhooks/")) {
    return;
  }

  try {
    // スコア計算を実行して勝者を判定
    const { game, players, logs } = serializeGameForCompute(gameData);
    const result = computeOnlineScore(game, players, logs);

    // 勝ち抜けプレイヤーがいない場合は通知しない
    if (!result.winPlayers || result.winPlayers.length === 0) {
      return;
    }

    // 勝ち抜けプレイヤーの名前を取得
    const winnerPlayer = gameData.players.find(
      (player) => player.id === result.winPlayers[0].player_id
    );

    if (!winnerPlayer) {
      return;
    }

    // Discord通知メッセージを作成
    const description = `${winnerPlayer.name}さんが勝ち抜けました:tada:\n${getAppBaseUrl()}/games/${gameData.id}/board`;

    // Discord Webhook APIにリクエストを送信
    await fetch(gameData.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "Score Watcher",
        avatar_url: `${getAppBaseUrl()}/icons/icon-512x512.png`,
        embeds: [
          {
            title: gameData.name,
            description,
            timestamp: cdate().utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
            color: 2664261, // Score Watcherのテーマカラー
            footer: {
              text: "© 2022-2024 newt",
              icon_url: `${getAppBaseUrl()}/icons/icon-512x512.png`,
            },
          },
        ],
      }),
    });
  } catch (error) {
    // Discord通知の失敗は非致命的エラーとして扱い、ログ出力のみ行う
    console.error("Discord webhook notification failed:", error);
  }
}

/**
 * Discord Webhookによるゲームリセット通知を送信する
 *
 * @param gameData リポジトリから取得したゲームデータ
 */
export async function sendDiscordResetNotification(gameData: GameWithRelations): Promise<void> {
  // Discord Webhook URLが設定されていない場合は何もしない
  if (!gameData.discordWebhookUrl?.startsWith("https://discord.com/api/webhooks/")) {
    return;
  }

  try {
    // Discord通知メッセージを作成
    const description = `ゲームがリセットされました\n${getAppBaseUrl()}/games/${gameData.id}/board`;

    // Discord Webhook APIにリクエストを送信
    await fetch(gameData.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "Score Watcher",
        avatar_url: `${getAppBaseUrl()}/icons/icon-512x512.png`,
        embeds: [
          {
            title: gameData.name,
            description,
            timestamp: cdate().utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
            color: 16711680, // 赤色（リセット通知用）
            footer: {
              text: "© 2022-2024 newt",
              icon_url: `${getAppBaseUrl()}/icons/icon-512x512.png`,
            },
          },
        ],
      }),
    });
  } catch (error) {
    // Discord通知の失敗は非致命的エラーとして扱い、ログ出力のみ行う
    console.error("Discord webhook notification failed:", error);
  }
}
