import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

const frenchFixture = readFileSync(
  join(import.meta.dirname, 'scripts/latin-fr.txt'),
  'utf-8',
).trim()

test.describe('storage disabled (FR-017)', () => {
  test('shows destructive alert when localStorage.setItem throws QuotaExceededError', async ({
    page,
  }) => {
    // Monkey-patch localStorage.setItem to throw on write
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      }
    })

    await page.goto('/play')
    await page.locator('textarea').fill(frenchFixture)
    await page.getByRole('button', { name: /start round/i }).click()

    // Should get redirected to the exercise (in-memory mode) or stay on /play with an alert
    // The alert should indicate sessions won't be saved
    const alert = page.locator('[role="alert"]')
    // Either on /play or on the exercise page, the save-disabled alert should appear
    await expect(alert.first()).toBeVisible({ timeout: 5000 })
  })
})
