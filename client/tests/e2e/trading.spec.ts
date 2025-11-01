import { test, expect } from "@playwright/test";

test.describe("Broker Trading System", () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу входа
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should login as broker", async ({ page }) => {
    // Проверяем наличие заголовка
    await expect(
      page.getByText("Брокерская Торговая Платформа")
    ).toBeVisible();

    // Проверяем наличие селекта с брокерами
    const select = page.locator("select");
    await expect(select).toBeVisible();

    // Выбираем первого брокера
    await select.selectOption({ index: 1 });

    // Нажимаем кнопку входа
    await page.getByRole("button", { name: /войти как брокер/i }).click();

    // Проверяем, что перешли на страницу брокера
    await expect(page).toHaveURL(/\/broker\/.+/);
  });

  test("should buy stocks and verify balance decrease", async ({ page }) => {
    // Входим как брокер
    const select = page.locator("select");
    await select.selectOption({ index: 1 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);

    // Ждем загрузки данных
    await page.waitForSelector("table", { timeout: 10000 });

    // Запоминаем начальный баланс
    const initialBalanceText = await page
      .locator('p:has-text("Денежные средства") + p')
      .textContent();
    const initialBalance = parseFloat(
      initialBalanceText?.replace("$", "") || "0"
    );

    // Находим первую активную акцию и нажимаем "Купить"
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();

    // Ждем появления диалога
    await page.waitForSelector(".modal-overlay", { timeout: 5000 });

    // Вводим количество акций
    await page.locator('input[type="number"]').fill("5");

    // Запоминаем сумму покупки
    const totalAmountText = await page
      .locator('.modal p:has-text("Сумма:") strong')
      .textContent();
    const totalAmount = parseFloat(totalAmountText?.replace("$", "") || "0");

    // Подтверждаем покупку
    await page.getByRole("button", { name: /^Купить$/i }).click();

    // Ждем закрытия диалога
    await page.waitForSelector(".modal-overlay", { state: "hidden" });

    // Ждем обновления баланса
    await page.waitForTimeout(1000);

    // Проверяем, что баланс уменьшился
    const newBalanceText = await page
      .locator('p:has-text("Денежные средства") + p')
      .textContent();
    const newBalance = parseFloat(newBalanceText?.replace("$", "") || "0");

    expect(newBalance).toBeLessThan(initialBalance);
    expect(Math.abs(newBalance - (initialBalance - totalAmount))).toBeLessThan(
      0.01
    );
  });

  test("should sell stocks and verify balance increase", async ({ page }) => {
    // Входим как брокер
    const select = page.locator("select");
    await select.selectOption({ index: 1 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);

    // Ждем загрузки данных
    await page.waitForSelector("table", { timeout: 10000 });

    // Сначала покупаем акции чтобы было что продавать
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");
    await page.locator('input[type="number"]').fill("10");
    await page.getByRole("button", { name: /^Купить$/i }).click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(1500);

    // Запоминаем текущий баланс
    const initialBalanceText = await page
      .locator('p:has-text("Денежные средства") + p')
      .textContent();
    const initialBalance = parseFloat(
      initialBalanceText?.replace("$", "") || "0"
    );

    // Продаем акции
    const portfolioTable = page.locator('h2:has-text("Мой портфель") + table');
    await portfolioTable.locator('button:has-text("Продать")').first().click();

    // Ждем появления диалога продажи
    await page.waitForSelector(".modal-overlay");

    // Вводим количество для продажи
    await page.locator('input[type="number"]').fill("5");

    // Запоминаем сумму продажи
    const sellAmountText = await page
      .locator('.modal p:has-text("Сумма:") strong')
      .textContent();
    const sellAmount = parseFloat(sellAmountText?.replace("$", "") || "0");

    // Подтверждаем продажу
    await page.getByRole("button", { name: /^Продать$/i }).click();

    // Ждем закрытия диалога
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(1000);

    // Проверяем, что баланс увеличился
    const newBalanceText = await page
      .locator('p:has-text("Денежные средства") + p')
      .textContent();
    const newBalance = parseFloat(newBalanceText?.replace("$", "") || "0");

    expect(newBalance).toBeGreaterThan(initialBalance);
    expect(Math.abs(newBalance - (initialBalance + sellAmount))).toBeLessThan(
      0.01
    );
  });

  test("should calculate profit/loss correctly", async ({ page }) => {
    // Входим как брокер
    const select = page.locator("select");
    await select.selectOption({ index: 1 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);

    await page.waitForSelector("table", { timeout: 10000 });

    // Покупаем акции
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");

    // Запоминаем цену покупки
    const buyPriceText = await page
      .locator('.modal p:has-text("Текущая цена:")')
      .textContent();
    const buyPrice = parseFloat(
      buyPriceText?.match(/\$(\d+\.\d+)/)?.[1] || "0"
    );

    await page.locator('input[type="number"]').fill("10");
    await page.getByRole("button", { name: /^Купить$/i }).click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });

    // Ждем появления акции в портфеле
    await page.waitForTimeout(2000);

    // Проверяем наличие данных о прибыли/убытке в портфеле
    const portfolioTable = page.locator('h2:has-text("Мой портфель") + table');
    await expect(portfolioTable).toBeVisible();

    // Проверяем, что есть колонка с прибылью/убытком
    const profitLossCell = portfolioTable.locator(
      "tbody tr:first-child td:nth-child(7)"
    );
    await expect(profitLossCell).toBeVisible();

    const profitLossText = await profitLossCell.textContent();
    expect(profitLossText).toMatch(/[\+\-]?\$\d+\.\d+/);
  });

  test("should prevent buying stocks with insufficient funds", async ({
    page,
  }) => {
    // Входим как брокер
    const select = page.locator("select");
    await select.selectOption({ index: 1 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);

    await page.waitForSelector("table", { timeout: 10000 });

    // Пытаемся купить очень большое количество акций
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");

    await page.locator('input[type="number"]').fill("100000");
    await page.getByRole("button", { name: /^Купить$/i }).click();

    // Ждем появления ошибки
    await expect(page.locator(".error")).toBeVisible({ timeout: 5000 });
  });

  test("should display admin panel with all brokers", async ({ page }) => {
    // Переходим в панель администратора
    await page.getByRole("button", { name: /войти как администратор/i }).click();
    await page.waitForURL("/admin");

    // Проверяем заголовок
    await expect(page.getByText("Панель администратора")).toBeVisible();

    // Проверяем наличие информации о брокерах
    await expect(page.locator("h3")).toHaveCount({ timeout: 10000 }, { min: 1 });
  });
});

