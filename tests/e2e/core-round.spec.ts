import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const FIXTURES = join(__dirname, "scripts");

async function runRound(
  page: Page,
  fixture: string,
  intentionallyWrong = true
) {
  const passage = readFileSync(join(FIXTURES, fixture), "utf-8").trim();

  await page.goto("/play");
  await page.locator("textarea").fill(passage);
  await page.getByRole("button", { name: /start round/i }).click();

  await page.waitForURL(/\/play\/.+/);

  const inputs = page.locator('input[aria-label*="blank"]');
  const count = await inputs.count();
  expect(count).toBeGreaterThan(0);

  // Fill all blanks correctly, except the last one if intentionallyWrong
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const label = await input.getAttribute("aria-label");
    const correctWord =
      label?.match(/correct word is "([^"]+)"/i)?.[1] ?? "wrong";

    if (intentionallyWrong && i === count - 1) {
      await input.fill("deliberatelywronganswerxyz");
    } else {
      await input.fill(correctWord);
    }
  }

  await page.getByRole("button", { name: /submit answers/i }).click();
  await page.waitForURL(/\/results\/.+/);

  // Score should be visible
  const scoreCard = page.locator('[role="status"]');
  await expect(scoreCard).toBeVisible();
  const scoreText = await scoreCard.textContent();
  expect(scoreText).toMatch(/\d+ of \d+ correct/i);

  if (intentionallyWrong) {
    // Wrong answer should appear in review list
    const reviewList = page.locator("ul");
    await expect(reviewList).toBeVisible();
  }

  return { count, passage };
}

test.describe("core round — Latin (French)", () => {
  test("full round with latin-fr.txt", async ({ page }) => {
    await runRound(page, "latin-fr.txt");
  });
});

test.describe("core round — Cyrillic (Russian)", () => {
  test("full round with cyrillic-ru.txt", async ({ page }) => {
    await runRound(page, "cyrillic-ru.txt");
  });
});

test.describe("core round — CJK (Chinese)", () => {
  test("full round with cjk-zh.txt", async ({ page }) => {
    await runRound(page, "cjk-zh.txt");
  });
});

test.describe("core round — Arabic (RTL)", () => {
  test("full round with arabic-ar.txt, no horizontal scroll", async ({
    page,
  }) => {
    await runRound(page, "arabic-ar.txt");

    // RTL layout sanity check: no horizontal scroll on exercise page
    // (navigate to exercise page to check)
    await page.goto("/play");
    const passage = readFileSync(join(FIXTURES, "arabic-ar.txt"), "utf-8").trim();
    await page.locator("textarea").fill(passage);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
