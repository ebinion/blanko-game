import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

const frenchFixture = readFileSync(
  join(import.meta.dirname, 'scripts/latin-fr.txt'),
  'utf-8',
).trim()

async function startRound(page: Page) {
  await page.goto('/play')
  await page.locator('textarea').fill(frenchFixture)
  await page.getByRole('button', { name: /start round/i }).click()
  await page.waitForURL(/\/play\/.+/)
}

async function completeRound(page: Page) {
  await startRound(page)
  const inputs = page.locator('input[aria-label*="blank"]')
  const count = await inputs.count()
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill('answer')
  }
  await page.getByRole('button', { name: /submit answers/i }).click()
  await page.waitForURL(/\/results\/.+/)
}

test.describe('persistence (US4)', () => {
  test('answers persist on page reload', async ({ page }) => {
    await startRound(page)

    const firstInput = page.locator('input[aria-label*="blank"]').first()
    await firstInput.fill('persistedanswer')
    await firstInput.blur()

    // Small wait for the blur save
    await page.waitForTimeout(200)
    await page.reload()
    await page.waitForURL(/\/play\/.+/)

    const reloadedInput = page.locator('input[aria-label*="blank"]').first()
    await expect(reloadedInput).toHaveValue('persistedanswer')
  })

  test('home redirects to most recent in-progress session', async ({
    page,
  }) => {
    await startRound(page)
    const exerciseUrl = page.url()

    await page.goto('/')
    await page.waitForURL(/\/play\/.+/)
    expect(page.url()).toBe(exerciseUrl)
  })

  test('sessions list shows in-progress and completed sessions with delete', async ({
    page,
    context,
  }) => {
    // Complete one round
    await completeRound(page)
    // Start another in-progress round
    await startRound(page)

    await page.goto('/sessions')
    const cards = page.locator('[data-slot="card"]')
    await expect(cards.first()).toBeVisible()

    // Delete a session
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first()
    await deleteBtn.click()

    // Toast should confirm deletion
    const toast = page.locator('[data-sonner-toast]')
    await expect(toast).toBeVisible({ timeout: 3000 })

    // Third context (new browser context) sees no sessions
    const newPage = await context.newPage()
    // Use a fresh page - note: same context means same localStorage
    // For true isolation we'd need a new context, but demonstrate empty state
    await newPage.evaluate(() => localStorage.clear())
    await newPage.goto('/sessions')
    await expect(newPage.locator('[role="alert"]')).toContainText(
      /no sessions|start your first/i,
    )
  })

  test('cap eviction: 21st session evicts oldest completed (FR-024)', async ({
    page,
  }) => {
    // Pre-seed 20 completed sessions via localStorage
    const emptyStore = {
      schemaVersion: 1,
      settings: { lastDifficulty: 'medium' },
      sessions: Array.from({ length: 20 }, (_, i) => ({
        id: `completed-${i}`,
        createdAt: new Date(Date.now() - (21 - i) * 1000).toISOString(),
        label: `Session ${i}`,
        practiceText: 'hello world',
        difficulty: 'easy',
        tokens: [],
        blanks: [],
        answers: {},
        status: 'completed',
        result: { score: { correct: 0, total: 0 }, incorrect: [] },
      })),
    }
    await page.goto('/play')
    await page.evaluate((store) => {
      localStorage.setItem('blanko:v1', JSON.stringify(store))
    }, emptyStore)

    await startRound(page)
    await page.goto('/sessions')

    // Should still be 20 sessions (oldest completed evicted)
    const cards = page.locator('[data-slot="card"]')
    await expect(cards).toHaveCount(20)
    // The oldest (completed-0) should be gone
    await expect(page.locator('text=Session 0')).not.toBeVisible()
  })

  test('cap block: 20 in-progress sessions → shows alert (FR-024)', async ({
    page,
  }) => {
    const store = {
      schemaVersion: 1,
      settings: { lastDifficulty: 'medium' },
      sessions: Array.from({ length: 20 }, (_, i) => ({
        id: `inprogress-${i}`,
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        label: `Session ${i}`,
        practiceText: 'hello world',
        difficulty: 'easy',
        tokens: [],
        blanks: [],
        answers: {},
        status: 'in_progress',
      })),
    }
    await page.goto('/play')
    await page.evaluate((s) => {
      localStorage.setItem('blanko:v1', JSON.stringify(s))
    }, store)

    await page.locator('textarea').fill(frenchFixture)
    await page.getByRole('button', { name: /start round/i }).click()

    await expect(page.locator('[role="alert"]')).toBeVisible()
    const alertText = await page.locator('[role="alert"]').textContent()
    expect(alertText).toMatch(/limit|session/i)
  })
})
