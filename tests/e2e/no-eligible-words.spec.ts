import { test, expect } from "@playwright/test";

test.describe("no eligible words (FR-013)", () => {
  test("shows alert when passage has no eligible words at Hard", async ({
    page,
  }) => {
    const tinyPassage = "a is at it on or up";

    await page.goto("/play");

    // Select Hard difficulty
    await page.getByRole("radio", { name: /hard/i }).click();

    const textarea = page.locator("textarea");
    await textarea.fill(tinyPassage);
    await page.getByRole("button", { name: /start round/i }).click();

    // Should stay on /play and show an alert
    await expect(page).toHaveURL("/play");
    await expect(page.locator('[role="alert"]')).toBeVisible();
    const alertText = await page.locator('[role="alert"]').textContent();
    expect(alertText).toBeTruthy();

    // Original text should still be in the textarea
    await expect(textarea).toHaveValue(tinyPassage);
  });
});
