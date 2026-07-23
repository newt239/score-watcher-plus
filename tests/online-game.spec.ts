import { expect, test } from "@playwright/test";

const TEST_EMAIL = "e2e-test@example.com";
const TEST_PASSWORD = "test123456";
const GAME_NAME = "E2Eテストゲーム";

test.describe.configure({ mode: "serial" });

test.describe("オンライン版の基本フロー", () => {
  let gameId: string;

  test.beforeEach(async ({ context }) => {
    // UpdateModalの表示を回避する
    await context.addInitScript(() => {
      window.localStorage.setItem("scorewatcher-version", "e2e");
    });
  });

  test.afterAll(async ({ request }) => {
    // 作成したゲームを削除してDBの汚染を防ぐ
    if (gameId) {
      await request.post("/api/e2e/test-login", {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      await request.delete(`/api/games/${gameId}`);
    }
  });

  test("未ログインで/gamesにアクセスするとサインインページへリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/games");
    await page.waitForURL("**/sign-in");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("旧URL(/online/games)は新URL(/games)へリダイレクトされる", async ({ page }) => {
    await page.goto("/online/games");
    await expect(page).toHaveURL(/\/(games|sign-in)$/);
  });

  test("形式一覧からゲームを作成して設定ページへ遷移できる", async ({ page }) => {
    // テストユーザーでログイン（cookieはブラウザコンテキストと共有される）
    const loginResponse = await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(loginResponse.ok()).toBeTruthy();

    await page.goto("/rules");
    await expect(page.getByRole("heading", { name: "形式一覧" })).toBeVisible();

    // N○M✕形式のカードから「作る」をクリック
    const card = page
      .locator(".mantine-Card-root")
      .filter({ hasText: /^N○M✕/ })
      .first();
    await card.getByRole("button", { name: "作る" }).click();

    // モーダルでゲーム名を入力して作成
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("ゲーム名").fill(GAME_NAME);
    await dialog.getByRole("button", { name: "作る" }).click();

    // 設定ページ（形式設定タブ）へ遷移する
    await page.waitForURL(/\/games\/[^/]+\/config\/rule/);
    const match = page.url().match(/\/games\/([^/]+)\/config/);
    expect(match).not.toBeNull();
    gameId = match![1];

    await expect(page.getByRole("tab", { name: "形式設定" })).toBeVisible();
  });

  test("プレイヤーを作成してゲームを開始できる", async ({ page }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await page.goto(`/games/${gameId}/config/player`);

    // プレイヤーを新規作成してゲームに追加
    await page.getByLabel("氏名").fill("テストプレイヤー1");
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText("プレイヤーを作成しました")).toBeVisible();

    // ゲーム開始ボタンが活性化され、ボードへ遷移できる
    const startButton = page.getByRole("link", { name: /ゲーム開始|ボードを開く/ });
    await expect(startButton).toBeVisible();
    await startButton.click();

    await page.waitForURL(/\/games\/[^/]+\/board/);
    await expect(page.getByText("テストプレイヤー1")).toBeVisible();
  });

  test("スコアボードで得点操作ができる", async ({ page }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await page.goto(`/games/${gameId}/board`);
    await expect(page.getByText("テストプレイヤー1")).toBeVisible();

    // 正解ボタン（0○）をクリックするとスコアが1○になる
    await page.getByRole("button", { name: /^0\s*○$/ }).click();
    await expect(page.getByRole("button", { name: /^1\s*○$/ })).toBeVisible();
  });

  test("ゲームを公開すると認証なしで観戦APIにアクセスできる", async ({ page, browser }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    // その他の設定タブで公開に切り替える
    await page.goto(`/games/${gameId}/config/other`);
    await page.getByRole("switch").check({ force: true });
    await page.getByRole("button", { name: "公開する" }).click();
    await expect(page.getByText("は現在公開中です", { exact: false })).toBeVisible();

    // 未認証コンテキストからviewer APIにアクセスできる（200: キャッシュあり / 202: 準備中）
    const viewerContext = await browser.newContext({ baseURL: "http://localhost:3000" });
    const response = await viewerContext.request.get(`/api/viewer/games/${gameId}/board`, {
      headers: { "x-playwright-test": "true" },
    });
    expect([200, 202]).toContain(response.status());
    await viewerContext.close();
  });
});
