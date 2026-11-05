import { expect, test, type Page } from "@playwright/test";

const TEST_EMAIL = "e2e-test@example.com";
const TEST_PASSWORD = "test123456";
const GAME_NAME = "E2Eテストゲーム";

/** ページへ遷移し、UpdateModal（バージョン告知）が表示されていれば閉じる */
const gotoAndDismissUpdateModal = async (page: Page, url: string) => {
  await page.goto(url);
  const updateModalTitle = page.getByText("新しいバージョンがリリースされました");
  await updateModalTitle.waitFor({ timeout: 2000 }).catch(() => {});
  if (await updateModalTitle.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await updateModalTitle.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }
};

test.describe.configure({ mode: "serial" });

test.describe("オンライン版の基本フロー", () => {
  let gameId: string;

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
    await page.waitForURL(/\/sign-in\?next=%2Fgames$/);
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fgames$/);
  });

  test("未ログインで/migrationにアクセスするとログイン後に戻れる形でリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/migration");
    await page.waitForURL(/\/sign-in\?next=%2Fmigration$/);
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fmigration$/);
  });

  test("旧URL(/online/games)は新URL(/games)へリダイレクトされる", async ({ page }) => {
    await page.goto("/online/games");
    await expect(page).toHaveURL(/\/games$|\/sign-in\?next=%2Fgames$/);
  });

  test("形式一覧からゲームを作成して設定ページへ遷移できる", async ({ page }) => {
    // テストユーザーでログイン（cookieはブラウザコンテキストと共有される）
    const loginResponse = await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(loginResponse.ok()).toBeTruthy();

    await gotoAndDismissUpdateModal(page, "/rules");
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

    // プレイヤーが0人だとDrawerの導線が出ないため、先に1人だけAPIで用意する
    await page.request.post("/api/players", {
      data: [{ name: "テストプレイヤー0" }],
    });

    await gotoAndDismissUpdateModal(page, `/games/${gameId}/config/player`);

    // プレイヤー選択Drawerを開き、「新しく追加」からプレイヤーを作成
    await page.getByRole("button", { name: "プレイヤーを選択" }).click();
    await page.getByRole("button", { name: "新しく追加" }).click();
    await page.getByLabel("氏名").fill("テストプレイヤー1");
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await expect(page.getByText("プレイヤーを作成しました")).toBeVisible();

    // Drawerを閉じてページを再読込し、ゲーム開始ボタンからボードへ遷移する
    await page.keyboard.press("Escape");
    await page.reload();
    const startButton = page.getByRole("link", { name: /ゲーム開始|ボードを開く/ });
    await expect(startButton).toBeVisible();
    await startButton.click();

    await page.waitForURL(/\/games\/[^/]+\/board/);
    // ボード上では英数字が全角表示される（テストプレイヤー１）
    await expect(page.getByText(/テストプレイヤー[1１]/)).toBeVisible();
  });

  test("スコアボードで得点操作ができる", async ({ page }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await gotoAndDismissUpdateModal(page, `/games/${gameId}/board`);
    await expect(page.getByText(/テストプレイヤー[1１]/)).toBeVisible();

    // 正解ボタン（○0）をクリックするとスコアが○1になる
    await page.getByRole("button", { name: /^○\s*0$/ }).click();
    await expect(page.getByRole("button", { name: /^○\s*1$/ })).toBeVisible();
  });

  test("ゲームを公開すると認証なしで観戦APIにアクセスできる", async ({
    page,
    browser,
    baseURL,
  }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    // その他の設定タブで公開に切り替える
    await gotoAndDismissUpdateModal(page, `/games/${gameId}/config/other`);
    await page.locator(".mantine-Switch-track").click();
    await page.getByRole("button", { name: "公開する" }).click();
    // 更新完了（モーダルが閉じる）を待ち、リロード後に公開状態を確認
    await expect(page.getByRole("button", { name: "公開する" })).toBeHidden();
    await page.reload();
    await expect(page.getByText("は現在公開中です", { exact: false }).first()).toBeVisible();

    // 未認証コンテキストからviewer APIにアクセスできる
    const viewerContext = await browser.newContext({ baseURL });
    const response = await viewerContext.request.get(`/api/viewer/games/${gameId}/board`, {
      headers: { "x-playwright-test": "true" },
    });
    expect(response.status()).toBe(200);

    // 観戦ページにプレイヤー名とゲームログが表示される
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto(`/viewer/${gameId}`);
    await expect(viewerPage.getByText("テストプレイヤー1", { exact: true })).toBeVisible();
    await expect(viewerPage.getByText("正解", { exact: false })).toBeVisible();
    await viewerContext.close();
  });

  test("スコアの手動更新モードに切り替えられる", async ({ page }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await gotoAndDismissUpdateModal(page, `/games/${gameId}/board`);

    // 手動更新モードに切り替えるとスコアが入力欄になる
    await page.getByRole("button", { name: "スコアの手動更新" }).click();
    await expect(page.locator("input[value='○1']").first()).toBeVisible();

    // 「スルー」「一つ戻す」は手動更新モード中は操作できない
    await expect(page.getByRole("button", { name: "スルー" })).toBeDisabled();

    // 元に戻す
    await page.getByRole("button", { name: "スコアの手動更新" }).click();
    await expect(page.getByRole("button", { name: /^○\s*1$/ })).toBeVisible();
  });

  test("オフライン中の得点操作がアウトボックスに残り、復帰後に送信される", async ({
    page,
    context,
  }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await gotoAndDismissUpdateModal(page, `/games/${gameId}/board`);
    const scoreButton = page.getByRole("button", { name: /^○\s*\d+$/ }).first();
    await expect(scoreButton).toBeVisible();
    // オフラインアウトボックスの初期化を待つ
    await expect(page.getByText(/未送信|送信中/)).toHaveCount(0);

    const before = Number(((await scoreButton.textContent()) ?? "").replace(/\D/g, ""));

    await context.setOffline(true);

    // オフラインでも操作は即座に盤面へ反映される
    await scoreButton.click();
    await expect(scoreButton).toHaveText(new RegExp(`○\\s*${before + 1}`));
    await scoreButton.click();
    await expect(scoreButton).toHaveText(new RegExp(`○\\s*${before + 2}`));

    // 未送信件数が表示される
    await expect(page.getByText(/オフライン・未送信2件/)).toBeVisible();

    await context.setOffline(false);

    // 復帰すると送信が完了し、バッジが消える
    await expect(page.getByText(/未送信|送信中/)).toHaveCount(0, { timeout: 30000 });

    // リロードしてもサーバーに反映されている
    await gotoAndDismissUpdateModal(page, `/games/${gameId}/board`);
    await expect(page.getByRole("button", { name: /^○\s*\d+$/ }).first()).toHaveText(
      new RegExp(`○\\s*${before + 2}`)
    );
  });

  test("ゲームをリセットするとプレイログが削除される", async ({ page }) => {
    await page.request.post("/api/e2e/test-login", {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    await gotoAndDismissUpdateModal(page, `/games/${gameId}/config/other`);

    await page.getByRole("button", { name: "リセットする" }).click();
    // 確認モーダル内のボタンを押す
    await page.getByRole("dialog").getByRole("button", { name: "リセットする" }).click();
    await expect(page.getByText("ゲームをリセットしました")).toBeVisible();

    // ボードのスコアが初期状態に戻る
    await gotoAndDismissUpdateModal(page, `/games/${gameId}/board`);
    await expect(page.getByRole("button", { name: /^○\s*0$/ })).toBeVisible();
  });
});
