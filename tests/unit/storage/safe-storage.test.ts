import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Store } from '~/engine/types'

const EMPTY_STORE: Store = {
  schemaVersion: 1,
  settings: { lastDifficulty: 'medium' },
  sessions: [],
}

describe('safe-storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    // Reset the module's saveDisabled flag between tests
    vi.resetModules()
  })

  it('read returns parsed JSON when valid', async () => {
    const { readStore: read } = await import('~/storage/safe-storage')
    const store: Store = { ...EMPTY_STORE, sessions: [] }
    localStorage.setItem('blanko:v1', JSON.stringify(store))
    expect(read()).toEqual(store)
  })

  it('read returns EMPTY_STORE when key is missing', async () => {
    const { readStore: read } = await import('~/storage/safe-storage')
    expect(read()).toEqual(EMPTY_STORE)
  })

  it('read returns EMPTY_STORE when JSON.parse throws', async () => {
    const { readStore: read } = await import('~/storage/safe-storage')
    localStorage.setItem('blanko:v1', 'not valid json {{{}')
    expect(read()).toEqual(EMPTY_STORE)
  })

  it('write succeeds and round-trips', async () => {
    const { readStore: read, writeStore: write } =
      await import('~/storage/safe-storage')
    const store: Store = { ...EMPTY_STORE }
    write(store)
    expect(read()).toEqual(store)
  })

  it('write throwing QuotaExceededError sets saveDisabled and does not rethrow', async () => {
    const { writeStore: write, isSaveDisabled: isDisabled } =
      await import('~/storage/safe-storage')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError')
    })
    expect(() => write(EMPTY_STORE)).not.toThrow()
    expect(isDisabled()).toBe(true)
  })

  it('write throwing SecurityError sets saveDisabled and does not rethrow', async () => {
    const { writeStore: write, isSaveDisabled: isDisabled } =
      await import('~/storage/safe-storage')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError')
    })
    expect(() => write(EMPTY_STORE)).not.toThrow()
    expect(isDisabled()).toBe(true)
  })
})
