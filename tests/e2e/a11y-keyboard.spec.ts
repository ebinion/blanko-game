import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "fs";
import { join } from "path";

const frenchFixture = readFileSync(
  join(import.meta.dirname, "scripts/latin-fr.txt"),
  "utf-8"
).trim();

test.describe("a11y & keyboard navigation (SC-009, FR-028)", () => {
  test("start screen has zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto("/play");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toHaveLength(0);
  });

  test("exercise screen has zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toHaveLength(0);
  });

  test("results screen has zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.locator("textarea").fill(frenchFixture);
    await page.getByRole("button", { name: /start round/i }).click();
    await page.waitForURL(/\/play\/.+/);
    await page.getByRole("button", { name: /submit answers/i }).click();
    await page.waitForURL(/\/results\/.+/);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toHaveLength(0);
  });

  test("sessions screen has zero critical/serious axe violations", async ({
    page,
  }) => {
    await page.goto("/sessions");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toHaveLength(0);
  });
});
