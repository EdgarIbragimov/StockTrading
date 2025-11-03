import { test, expect } from "@playwright/test";

test.describe("Broker Trading System - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  /**
   * Тест 1: Покупка N акций и проверка изменения баланса
   * ТЗ п.7: "при покупке N акций в определённую дату соответствующим образом
   * изменяется баланс средств брокера"
   */
  test("should buy N stocks and decrease balance correctly", async ({
    page,
  }) => {
    // Входим как брокер с достаточным балансом
    await page.locator("select").selectOption({ index: 5 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);
    await page.waitForSelector("table", { timeout: 10000 });

    // Запоминаем начальный баланс
    const initialBalance = parseFloat(
      (
        await page.locator('p:has-text("Денежные средства") + p').textContent()
      )?.replace("$", "") || "0"
    );

    // Покупаем N=3 акции
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");
    await page.locator('.modal input[type="number"]').fill("3");

    // Запоминаем сумму покупки
    const purchaseAmount = parseFloat(
      (
        await page.locator('.modal p:has-text("Сумма:") strong').textContent()
      )?.replace("$", "") || "0"
    );

    // Подтверждаем покупку
    await page.locator('.modal button:has-text("Купить")').first().click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(500);

    // Проверяем что баланс уменьшился точно на сумму покупки
    const newBalance = parseFloat(
      (
        await page.locator('p:has-text("Денежные средства") + p').textContent()
      )?.replace("$", "") || "0"
    );

    const expectedBalance = initialBalance - purchaseAmount;
    expect(Math.abs(newBalance - expectedBalance)).toBeLessThan(0.01);
  });

  /**
   * Тест 2: Продажа N акций и проверка изменения баланса
   * ТЗ п.7: "при продаже N акций в определённую дату соответствующим образом
   * изменяется баланс средств брокера"
   */
  test("should sell N stocks and increase balance correctly", async ({
    page,
  }) => {
    // Входим как брокер
    await page.locator("select").selectOption({ index: 5 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);
    await page.waitForSelector("table", { timeout: 10000 });

    // Сначала покупаем акции
    await page
      .locator('tbody tr:has(.badge-success) button:has-text("Купить")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");
    await page.locator('.modal input[type="number"]').fill("5");
    await page.locator('.modal button:has-text("Купить")').first().click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(500);

    // Запоминаем баланс перед продажей
    const balanceBeforeSell = parseFloat(
      (
        await page.locator('p:has-text("Денежные средства") + p').textContent()
      )?.replace("$", "") || "0"
    );

    // Продаем N=2 акции
    await page
      .locator('h2:has-text("Мой портфель") + table button:has-text("Продать")')
      .first()
      .click();
    await page.waitForSelector(".modal-overlay");
    await page.locator('.modal input[type="number"]').fill("2");

    // Запоминаем сумму продажи
    const sellAmount = parseFloat(
      (
        await page.locator('.modal p:has-text("Сумма:") strong').textContent()
      )?.replace("$", "") || "0"
    );

    // Подтверждаем продажу
    await page.locator('.modal button:has-text("Продать")').first().click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(500);

    // Проверяем что баланс увеличился точно на сумму продажи
    const balanceAfterSell = parseFloat(
      (
        await page.locator('p:has-text("Денежные средства") + p').textContent()
      )?.replace("$", "") || "0"
    );

    const expectedBalance = balanceBeforeSell + sellAmount;
    expect(Math.abs(balanceAfterSell - expectedBalance)).toBeLessThan(0.01);
  });

  /**
   * Тест 3: Проверка расчета прибыли/убытка
   * ТЗ п.7: "получается правильная прибыль/убыток по данной акции"
   *
   * Проверяем что прибыль/убыток отображается в портфеле.
   * Формула: (текущая_цена - средняя_цена_покупки) × количество
   */
  test("should display profit/loss correctly in portfolio", async ({
    page,
  }) => {
    // Входим как брокер
    await page.locator("select").selectOption({ index: 5 });
    await page.getByRole("button", { name: /войти как брокер/i }).click();
    await page.waitForURL(/\/broker\/.+/);
    await page.waitForSelector("table", { timeout: 10000 });

    // Покупаем N=3 акции
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
    const quantity = 3;

    await page.locator('.modal input[type="number"]').fill(String(quantity));
    await page.locator('.modal button:has-text("Купить")').first().click();
    await page.waitForSelector(".modal-overlay", { state: "hidden" });
    await page.waitForTimeout(500);

    // Проверяем что акции появились в портфеле
    const portfolioTable = page.locator('h2:has-text("Мой портфель") + table');
    await expect(portfolioTable).toBeVisible();

    // Получаем данные из портфеля
    const avgPrice = parseFloat(
      (
        await portfolioTable
          .locator("tbody tr:first-child td:nth-child(4)")
          .textContent()
      )?.replace("$", "") || "0"
    );
    const currentPrice = parseFloat(
      (
        await portfolioTable
          .locator("tbody tr:first-child td:nth-child(5)")
          .textContent()
      )?.replace("$", "") || "0"
    );
    const profitLossText = await portfolioTable
      .locator("tbody tr:first-child td:nth-child(7)")
      .textContent();

    // Проверяем средняя цена = цена покупки (первая покупка)
    expect(Math.abs(avgPrice - buyPrice)).toBeLessThan(0.01);

    // Проверяем что поле прибыли/убытка отображается
    expect(profitLossText).toMatch(/[\+\-]?\$\d+\.\d+/);

    // Рассчитываем ожидаемую прибыль/убыток
    const expectedProfitLoss = (currentPrice - avgPrice) * quantity;

    // Парсим фактическую прибыль/убыток
    const actualProfitLoss = parseFloat(
      profitLossText?.replace(/[\+\$\-]/g, "") || "0"
    );
    const isNegative = profitLossText?.includes("-") || false;
    const finalProfitLoss = isNegative ? -actualProfitLoss : actualProfitLoss;

    // Проверяем правильность расчета
    expect(Math.abs(finalProfitLoss - expectedProfitLoss)).toBeLessThan(0.01);
  });
});
