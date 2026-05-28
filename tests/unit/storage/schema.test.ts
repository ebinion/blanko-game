import { describe, it, expect } from 'vitest'
import { EMPTY_STORE, validateStore } from '~/storage/schema'

describe('schema', () => {
  it("EMPTY_STORE matches { schemaVersion: 1, settings: { lastDifficulty: 'medium' }, sessions: [] }", () => {
    expect(EMPTY_STORE).toEqual({
      schemaVersion: 1,
      settings: { lastDifficulty: 'medium' },
      sessions: [],
    })
  })

  it('validateStore accepts a well-formed store', () => {
    expect(() => validateStore(EMPTY_STORE)).not.toThrow()
    expect(validateStore(EMPTY_STORE)).toEqual(EMPTY_STORE)
  })

  it('validateStore rejects a store with schemaVersion !== 1', () => {
    expect(() => validateStore({ ...EMPTY_STORE, schemaVersion: 2 })).toThrow()
    expect(() => validateStore({ ...EMPTY_STORE, schemaVersion: 0 })).toThrow()
  })

  it('validateStore rejects a store with duplicate session ids', () => {
    const session = {
      id: 'abc',
      createdAt: new Date().toISOString(),
      label: 'Test',
      practiceText: 'hello world',
      difficulty: 'medium' as const,
      tokens: [],
      blanks: [],
      answers: {},
      status: 'in_progress' as const,
    }
    expect(() =>
      validateStore({ ...EMPTY_STORE, sessions: [session, session] }),
    ).toThrow()
  })
})
