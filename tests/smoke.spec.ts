import { test, expect, Page } from "@playwright/test";

const PORT = 6590;

test.beforeEach(async ({ page, request }) => {
  await request
    .get(`http://localhost:${PORT}/api/reset`)
    .then((r) => console.log(`cleaning app: ${r.status()}`));
  await page.goto(`http://localhost:${PORT}`);
});

async function fillOutRegistrationForm(page: Page) {
  await expect(page).toHaveURL(
    `http://localhost:${PORT}/p/de/registration/new`
  );

  await page.locator('input[name="email"]').fill("foo@bar.com");
  await page.locator('input[name="participants\\.0\\.fullName"]').fill("Peter");

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
    .click();
  await page
    .locator('input[name="participants\\.0\\.address\\.country"]')
    .fill("Deut");
  await page.locator("text=Deutschland (DE)").click();

  await page.locator("text=Zelt").click();

  await page.locator("text=> 12 Jahre").click();

  await page.locator("text= 3 Tage (Freitag – Sonntag)").click();

  await page.getByRole("button", { name: "Auswählen" }).nth(2).click();
  await page.locator(".MuiButton-root").nth(1).click();

  await page.locator('textarea[name="comment"]').fill("Ne.");

  await page.locator("text=Anmelden").nth(1).click();
}

test.describe("smoke tests", () => {
  test("filling out registration should lead to success message", async ({
    page,
  }) => {
    await fillOutRegistrationForm(page);

    await page.waitForURL(
      `http://localhost:${PORT}/p/de/registration/new/success`
    );

    await expect(page.locator("h1")).toHaveText("Danke für deine Anmeldung!");
  });

  test("canceling registration should lead to it no longer being there", async ({
    page,
  }) => {
    await fillOutRegistrationForm(page);

    await page.goto(`http://localhost:${PORT}/admin/registrations`);

    await page.locator('input[name="login"]').fill("admin");
    await page.locator('input[name="password"]').fill("admin");

    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[name="password"]').press("Enter"),
    ]);

    await expect(page.locator("h2")).toHaveText("Anmeldungen");

    const tableRow = page.locator("tr").nth(1);
    await expect(tableRow).toHaveText(/foo@bar\.com/);

    await tableRow.locator("data-test-id=cancelRegistration").first().click();

    await tableRow.waitFor({ state: "detached" });
  });
});
