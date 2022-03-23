import { test, expect } from "@playwright/test";

const PORT = 6590;

test.beforeEach(async ({ page }) => {
  await page.goto(`http://localhost:${PORT}`);
});

test.describe("smoke test", () => {
  test("filling out registration should lead to success message", async ({
    page,
  }) => {
    await expect(page).toHaveURL(
      `http://localhost:${PORT}/p/de/registration/new`
    );

    await page.locator('input[name="email"]').fill("foo@bar.com");
    await page
      .locator('input[name="participants\\.0\\.fullName"]')
      .fill("Peter");

    await page
      .locator('select[name="participants\\.0\\.birthday\\.day"]')
      .selectOption("4");
    await page
      .locator('select[name="participants\\.0\\.birthday\\.month"]')
      .selectOption("5");
    await page
      .locator('select[name="participants\\.0\\.birthday\\.year"]')
      .selectOption("1997");

    await page
      .locator('input[name="participants\\.0\\.address\\.street"]')
      .fill("Fake Street 123");
    await page
      .locator('input[name="participants\\.0\\.address\\.postalCode"]')
      .fill("51351");
    await page
      .locator('input[name="participants\\.0\\.address\\.city"]')
      .fill("Münchhausen");
    await page
      .locator('input[name="participants\\.0\\.address\\.country"]')
      .fill("Welt");

    await page.locator("text=Do.–So., >12 Jahre: 30,00 €").click();
    await page.locator("text=Zelt").click();

    await page.locator('textarea[name="comment"]').fill("Ne.");

    await page.locator('input:has-text("Anmelden")').click();
    await page.waitForNavigation({
      url: `http://localhost:${PORT}/p/de/registration/success`,
    });

    expect(page.locator("h1")).toHaveText("Danke für deine Anmeldung!");
  });
});
