import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

const frenchFixture = readFileSync(
  join(import.meta.dirname, 'scripts/latin-fr.txt'),
  'utf-8',
).trim()

test.use({ viewport: { width: 390, height: 844 } })

test.describe('mobile viewport (FR-025)', () => {
  test('no horizontal scroll on exercise page (iPhone 13 viewport)', async ({
    page,
  }) => {
    await page.goto('/play')
    await page.locator('textarea').fill(frenchFixture)
    await page.getByRole('radio', { name: /hard/i }).click()
    await page.getByRole('button', { name: /start round/i }).click()
    await page.waitForURL(/\/play\/.+/)

    const hasHScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(hasHScroll).toBe(false)

    // Every blank input should be visible without horizontal scroll
    const inputs = page.locator('input[aria-label*="blank"]')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(390 + 1) // 1px tolerance
      }
    }
  })

  test('results review list renders without horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/play')
    await page.locator('textarea').fill(frenchFixture)
    await page.getByRole('button', { name: /start round/i }).click()
    await page.waitForURL(/\/play\/.+/)
    await page.getByRole('button', { name: /submit answers/i }).click()
    await page.waitForURL(/\/results\/.+/)

    const hasHScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(hasHScroll).toBe(false)
  })
})
