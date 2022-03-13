import { test, expect, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:6590");
});

test.describe("smoke test", () => {
  test("filling out registration should lead to success message", async ({
    page,
  }) => {
    await page.locator("text=Registrieren").click();
    await expect(page).toHaveURL("http://localhost:6590/de/registration/new");

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
    await page
      .locator('select[name="participants\\.0\\.accommodation"]')
      .selectOption("tent");

    await page.locator('textarea[name="comment"]').fill("Ne.");

    await page.locator('input:has-text("Anmelden")').click();
    await page.waitForNavigation({
      url: "http://localhost:6590/de/registration/success",
    });

    expect(page.locator("h1")).toHaveText("Danke für deine Anmeldung!");
  });
});
