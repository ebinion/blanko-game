import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const frenchFixture = readFileSync(
  join(import.meta.dirname, "scripts/latin-fr.txt"),
  "utf-8"
).trim();

test.describe("difficulty contrast (SC-007)", () => {
  test("Hard produces >= 2x Easy blank count AND avg word length >= 2 chars greater", async ({
    page,
  }) => {
    // Run Easy round
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("radio", { name: /easy/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    const easyInputs = page.locator('input[aria-label*="blank"]');
    const easyCount = await easyInputs.count();

    // Parse word lengths from aria-labels
    const easyLengths: number[] = [];
    for (let i = 0; i < easyCount; i++) {
      const label = await easyInputs.nth(i).getAttribute("aria-label");
      const match = label?.match(/correct word is "([^"]+)"/i);
      if (match) easyLengths.push(match[1].length);
    }
    const easyAvg = easyLengths.reduce((a, b) => a + b, 0) / (easyLengths.length || 1);

    // Run Hard round
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("radio", { name: /hard/i }).click();
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    const hardInputs = page.locator('input[aria-label*="blank"]');
    const hardCount = await hardInputs.count();

    const hardLengths: number[] = [];
    for (let i = 0; i < hardCount; i++) {
      const label = await hardInputs.nth(i).getAttribute("aria-label");
      const match = label?.match(/correct word is "([^"]+)"/i);
      if (match) hardLengths.push(match[1].length);
    }
    const hardAvg = hardLengths.reduce((a, b) => a + b, 0) / (hardLengths.length || 1);

    expect(hardCount).toBeGreaterThanOrEqual(easyCount * 2);
    expect(hardAvg).toBeGreaterThanOrEqual(easyAvg + 2);
  });
});
