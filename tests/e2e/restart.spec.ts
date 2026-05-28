import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const frenchFixture = readFileSync(
  join(__dirname, "scripts/latin-fr.txt"),
  "utf-8"
).trim();
const cyrillicFixture = readFileSync(
  join(__dirname, "scripts/cyrillic-ru.txt"),
  "utf-8"
).trim();

test.describe("restart (US5)", () => {
  test("Start new round goes to empty /play; both sessions appear in /sessions", async ({
    page,
  }) => {
    // Complete first round
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);
    await page.getByRole("button", { name: /submit answers/i }).click();
    await page.waitForURL(/\/results\/.+/);

    // Click "Start new round"
    await page.getByRole("link", { name: /start new round/i }).click();
    await page.waitForURL("/play");

    // Textarea should be empty and no error
    await expect(page.locator("textarea")).toHaveValue("");
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Complete second round
    await page.locator("textarea").fill(cyrillicFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);
    await page.getByRole("button", { name: /submit answers/i }).click();
    await page.waitForURL(/\/results\/.+/);

    // Both sessions should be in /sessions with distinct labels
    await page.goto("/sessions");
    const cards = page.locator('[data-slot="card"]');
    await expect(cards).toHaveCount(2);

    const labels = await page.locator('[data-slot="card-title"]').allTextContents();
    expect(new Set(labels).size).toBe(2);
  });
});
