import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const frenchFixture = readFileSync(
  join(__dirname, "scripts/latin-fr.txt"),
  "utf-8"
).trim();

async function startAndSubmitRound(page: Page, allCorrect: boolean) {
  await page.goto("/play");
  await page.locator("textarea").fill(frenchFixture);
  await page.getByRole("button", { name: /start round/i }).click();
  await page.waitForURL(/\/play\/.+/);

  const inputs = page.locator('input[aria-label*="blank"]');
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const label = await input.getAttribute("aria-label");
    const correctWord = label?.match(/correct word is "([^"]+)"/i)?.[1] ?? "x";

    if (!allCorrect && i === count - 1) {
      await input.fill("wronganswerxyz");
    } else {
      await input.fill(correctWord);
    }
  }

  await page.getByRole("button", { name: /submit answers/i }).click();
  await page.waitForURL(/\/results\/.+/);
}

test.describe("review screen (US3)", () => {
  test("wrong-answer rows render a Badge with 'Incorrect' and an XCircle icon", async ({
    page,
  }) => {
    await startAndSubmitRound(page, false);
    const badge = page.locator("text=Incorrect").first();
    await expect(badge).toBeVisible();
    // XCircle SVG should be inside the badge
    const badgeEl = page.locator('[class*="badge"]').filter({ hasText: "Incorrect" }).first();
    await expect(badgeEl.locator("svg")).toBeVisible();
  });

  test("perfect score renders Alert with 'Perfect score' and no review list", async ({
    page,
  }) => {
    await startAndSubmitRound(page, true);
    await expect(page.locator('[role="alert"]')).toContainText(/perfect score/i);
    const reviewList = page.locator("ul");
    await expect(reviewList).not.toBeVisible();
  });

  test("score Card has role=status and aria-live=polite (FR-029)", async ({
    page,
  }) => {
    await startAndSubmitRound(page, false);
    const card = page.locator('[role="status"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("aria-live", "polite");
  });

  test("empty blank produces IncorrectEntry with visible '(no answer)' placeholder", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    // Submit without filling in any answers
    await page.getByRole("button", { name: /submit answers/i }).click();
    await page.waitForURL(/\/results\/.+/);

    await expect(page.locator("text=(no answer)").first()).toBeVisible();
  });
});
