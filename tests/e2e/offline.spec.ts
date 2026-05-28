import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const frenchFixture = readFileSync(
  join(__dirname, "scripts/latin-fr.txt"),
  "utf-8"
).trim();

test.describe("offline (FR-030, FR-032)", () => {
  test("full round works with network disabled after first load", async ({
    page,
    context,
  }) => {
    const networkRequests: string[] = [];

    // First load — online, let PWA cache assets
    await page.goto("/play");

    // Go offline
    await context.setOffline(true);

    // Track any requests that go out while offline
    page.on("request", (req) => {
      networkRequests.push(req.url());
    });

    await page.reload();

    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    const inputs = page.locator('input[aria-label*="blank"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    await page.getByRole("button", { name: /submit answers/i }).click();
    await page.waitForURL(/\/results\/.+/);

    await expect(page.locator('[role="status"]')).toContainText(/correct/i);

    // No external network requests should have been made to third-party hosts
    const externalRequests = networkRequests.filter(
      (url) => !url.startsWith("http://localhost") && !url.startsWith("data:")
    );
    expect(externalRequests).toHaveLength(0);
  });
});
