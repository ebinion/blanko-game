import type { Session, Difficulty } from '~/engine/types'
import { tokenize } from '~/engine/tokenize'
import { selectBlanks } from '~/engine/select-blanks'
import { labelSession } from '~/engine/label'
import { readStore, writeStore } from './safe-storage'

const SESSION_CAP = 20

export class CapReachedError extends Error {
  constructor() {
    super('Session cap reached — finish or delete an existing session first')
    this.name = 'CapReachedError'
  }
}

function generateId(): string {
  return crypto.randomUUID()
}

export async function create(params: {
  practiceText: string
  difficulty: Difficulty
}): Promise<Session> {
  const store = readStore()
  const sessions = store.sessions

  if (sessions.length >= SESSION_CAP) {
    // Evict oldest completed session
    const completed = sessions
      .filter((s) => s.status === 'completed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    if (completed.length === 0) {
      throw new CapReachedError()
    }

    const idx = sessions.findIndex((s) => s.id === completed[0].id)
    sessions.splice(idx, 1)
  }

  const id = generateId()
  const now = new Date()
  const tokens = tokenize(params.practiceText)
  const blanks = selectBlanks(tokens, params.difficulty, { sessionId: id })

  const session: Session = {
    id,
    createdAt: now.toISOString(),
    label: labelSession(params.practiceText, now),
    practiceText: params.practiceText,
    difficulty: params.difficulty,
    tokens,
    blanks,
    answers: {},
    status: 'in_progress',
  }

  sessions.push(session)
  store.settings.lastDifficulty = params.difficulty

  writeStore(store)
  return session
}

export function get(id: string): Session | undefined {
  const store = readStore()
  return store.sessions.find((s) => s.id === id)
}

export function list(): Session[] {
  const store = readStore()
  return [...store.sessions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export function update(id: string, patch: Partial<Session>): void {
  const store = readStore()
  const idx = store.sessions.findIndex((s) => s.id === id)
  if (idx === -1) return
  store.sessions[idx] = { ...store.sessions[idx], ...patch }
  writeStore(store)
}

export function remove(id: string): void {
  const store = readStore()
  const idx = store.sessions.findIndex((s) => s.id === id)
  if (idx === -1) return
  store.sessions.splice(idx, 1)
  writeStore(store)
}
