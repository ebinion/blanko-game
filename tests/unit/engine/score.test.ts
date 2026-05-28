import { describe, it, expect } from 'vitest'
import { scoreSession } from '~/engine/score'
import type { Session, Blank } from '~/engine/types'
import { tokenize } from '~/engine/tokenize'

function makeSession(
  passage: string,
  blankWords: string[],
  answers: Record<string, string>,
): Session {
  const tokens = tokenize(passage)
  const blanks: Blank[] = blankWords.map((word, i) => {
    const tokenIndex = tokens.findIndex((t) => t.text === word && t.isWord)
    return { id: `b-${i}`, tokenIndex, correctWord: word }
  })
  return {
    id: 'test',
    createdAt: new Date().toISOString(),
    label: 'Test',
    practiceText: passage,
    difficulty: 'medium',
    tokens,
    blanks,
    answers,
    status: 'in_progress',
  }
}

describe('scoreSession', () => {
  it('all-correct → correct === total, incorrect === []', () => {
    const session = makeSession('Hello world test', ['Hello', 'world'], {
      'b-0': 'Hello',
      'b-1': 'world',
    })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(2)
    expect(result.score.total).toBe(2)
    expect(result.incorrect).toEqual([])
  })

  it('all-wrong → correct === 0, every blank appears in incorrect', () => {
    const session = makeSession('Hello world test', ['Hello', 'world'], {
      'b-0': 'wrong',
      'b-1': 'nope',
    })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(0)
    expect(result.incorrect).toHaveLength(2)
  })

  it('paris matches Paris (FR-019 case-insensitive)', () => {
    const session = makeSession('Paris is beautiful', ['Paris'], {
      'b-0': 'paris',
    })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(1)
  })

  it('ecole does NOT match école (FR-019 accent-sensitive)', () => {
    const session = makeSession("L'école est belle", ['école'], {
      'b-0': 'ecole',
    })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(0)
    expect(result.incorrect).toHaveLength(1)
  })

  it('empty string answer counted as incorrect (FR-012)', () => {
    const session = makeSession('Hello world', ['Hello'], { 'b-0': '' })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(0)
    expect(result.incorrect[0].userAnswer).toBe('')
  })

  it('whitespace-only answer counted as incorrect', () => {
    const session = makeSession('Hello world', ['Hello'], { 'b-0': '   ' })
    const result = scoreSession(session)
    expect(result.score.correct).toBe(0)
  })

  it('é typed as e + U+0301 matches é as U+00E9 (NFC normalization)', () => {
    const passage = 'école' // é as single precomposed char
    const tokens = tokenize(passage)
    const blank: Blank = { id: 'b-0', tokenIndex: 0, correctWord: 'école' }
    const session: Session = {
      id: 'test',
      createdAt: new Date().toISOString(),
      label: 'Test',
      practiceText: passage,
      difficulty: 'medium',
      tokens,
      blanks: [blank],
      answers: { 'b-0': 'école' }, // é as decomposed form
      status: 'in_progress',
    }
    const result = scoreSession(session)
    expect(result.score.correct).toBe(1)
  })
})
