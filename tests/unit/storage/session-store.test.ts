import { describe, it, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'blanko:v1'

function seedStore(data: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

describe('session-store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('create appends a new session, updates lastDifficulty, and persists', async () => {
    const { create, list } = await import('~/storage/session-store')
    const session = await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'hard',
    })
    expect(session.status).toBe('in_progress')
    expect(session.difficulty).toBe('hard')
    const sessions = list()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].id).toBe(session.id)
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.settings.lastDifficulty).toBe('hard')
  })

  it('get(id) returns the session or undefined', async () => {
    const { create, get } = await import('~/storage/session-store')
    const session = await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'easy',
    })
    expect(get(session.id)).toBeDefined()
    expect(get('nonexistent')).toBeUndefined()
  })

  it('list() returns sessions sorted by createdAt descending', async () => {
    const { EMPTY_STORE } = await import('~/storage/schema')
    const { list } = await import('~/storage/session-store')
    // Seed two sessions with explicit timestamps to avoid same-millisecond flakiness
    const older = {
      id: 'older',
      createdAt: '2026-01-01T00:00:00.000Z',
      label: 'Older session',
      practiceText: 'hello world',
      difficulty: 'easy' as const,
      tokens: [],
      blanks: [],
      answers: {},
      status: 'in_progress' as const,
    }
    const newer = {
      id: 'newer',
      createdAt: '2026-06-01T00:00:00.000Z',
      label: 'Newer session',
      practiceText: 'hello world',
      difficulty: 'medium' as const,
      tokens: [],
      blanks: [],
      answers: {},
      status: 'in_progress' as const,
    }
    seedStore({ ...EMPTY_STORE, sessions: [older, newer] })
    const sessions = list()
    expect(sessions[0].id).toBe('newer')
    expect(sessions[1].id).toBe('older')
  })

  it('update(id, patch) merges and persists', async () => {
    const { create, get, update } = await import('~/storage/session-store')
    const session = await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'easy',
    })
    update(session.id, { answers: { 'a-1': 'hello' } })
    const updated = get(session.id)
    expect(updated?.answers['a-1']).toBe('hello')
  })

  it('delete(id) removes the session', async () => {
    const { create, get, remove } = await import('~/storage/session-store')
    const session = await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'easy',
    })
    remove(session.id)
    expect(get(session.id)).toBeUndefined()
  })

  it('create evicts oldest completed session when cap is hit (FR-024)', async () => {
    const { create, list } = await import('~/storage/session-store')
    const { EMPTY_STORE } = await import('~/storage/schema')

    // Pre-seed 20 sessions: 19 in_progress + 1 oldest completed
    const sessions = []
    for (let i = 0; i < 19; i++) {
      sessions.push({
        id: `session-${i}`,
        createdAt: new Date(Date.now() - (20 - i) * 1000).toISOString(),
        label: `Session ${i}`,
        practiceText: 'hello world',
        difficulty: 'easy' as const,
        tokens: [],
        blanks: [],
        answers: {},
        status: 'in_progress' as const,
      })
    }
    // Oldest completed session
    const oldestCompleted = {
      id: 'oldest-completed',
      createdAt: new Date(Date.now() - 21 * 1000).toISOString(),
      label: 'Oldest completed',
      practiceText: 'hello world',
      difficulty: 'easy' as const,
      tokens: [],
      blanks: [],
      answers: {},
      status: 'completed' as const,
      result: { score: { correct: 0, total: 0 }, incorrect: [] },
    }
    seedStore({
      ...EMPTY_STORE,
      sessions: [oldestCompleted, ...sessions],
    })

    const newSession = await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'medium',
    })
    const allSessions = list()
    expect(allSessions).toHaveLength(20)
    expect(allSessions.find((s) => s.id === 'oldest-completed')).toBeUndefined()
    expect(allSessions.find((s) => s.id === newSession.id)).toBeDefined()
  })

  it('create throws CapReachedError when cap is hit and no completed session exists', async () => {
    const { create, CapReachedError } = await import('~/storage/session-store')
    const { EMPTY_STORE } = await import('~/storage/schema')

    const sessions = Array.from({ length: 20 }, (_, i) => ({
      id: `session-${i}`,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      label: `Session ${i}`,
      practiceText: 'hello world',
      difficulty: 'easy' as const,
      tokens: [],
      blanks: [],
      answers: {},
      status: 'in_progress' as const,
    }))
    seedStore({ ...EMPTY_STORE, sessions })

    await expect(
      create({ practiceText: 'Hello world foo bar baz', difficulty: 'medium' }),
    ).rejects.toThrow(CapReachedError)
  })

  it('create updates settings.lastDifficulty to the difficulty of the new session', async () => {
    const { create } = await import('~/storage/session-store')
    await create({
      practiceText: 'Hello world foo bar baz',
      difficulty: 'hard',
    })
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.settings.lastDifficulty).toBe('hard')
  })
})
