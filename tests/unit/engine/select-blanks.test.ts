import { describe, it, expect } from 'vitest'
import { selectBlanks } from '~/engine/select-blanks'
import { difficultyConfig } from '~/engine/difficulty'
import { tokenize } from '~/engine/tokenize'

const PARAGRAPH =
  'The quick brown fox jumps over the lazy dog while the friendly elephant walked slowly through the magnificent forest near the beautiful mountain stream where many colorful birds sang their melodious songs every morning during the warm summer days in this peaceful valley surrounded by ancient trees.'

describe('selectBlanks', () => {
  it('returns <= blankCap[difficulty] blanks', () => {
    const tokens = tokenize(PARAGRAPH)
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const blanks = selectBlanks(tokens, difficulty)
      expect(blanks.length).toBeLessThanOrEqual(
        difficultyConfig(difficulty).blankCap,
      )
    }
  })

  it('every returned tokenIndex points at a token with isWord: true', () => {
    const tokens = tokenize(PARAGRAPH)
    const blanks = selectBlanks(tokens, 'medium')
    for (const blank of blanks) {
      expect(tokens[blank.tokenIndex].isWord).toBe(true)
    }
  })

  it('sorted by tokenIndex ascending, unique indexes', () => {
    const tokens = tokenize(PARAGRAPH)
    const blanks = selectBlanks(tokens, 'medium')
    for (let i = 1; i < blanks.length; i++) {
      expect(blanks[i].tokenIndex).toBeGreaterThan(blanks[i - 1].tokenIndex)
    }
    const indexes = blanks.map((b) => b.tokenIndex)
    expect(new Set(indexes).size).toBe(indexes.length)
  })

  it('deterministic across two calls with the same inputs', () => {
    const tokens = tokenize(PARAGRAPH)
    const a = selectBlanks(tokens, 'hard')
    const b = selectBlanks(tokens, 'hard')
    expect(a).toEqual(b)
  })

  it('returns [] when no eligible words exist (FR-013)', () => {
    const tokens = tokenize('... --- ...')
    const blanks = selectBlanks(tokens, 'hard')
    expect(blanks).toEqual([])
  })

  it('Hard produces >= 2x Easy count AND avg blanked-word length >= 2 chars higher (SC-007)', () => {
    const tokens = tokenize(PARAGRAPH)
    const easyBlanks = selectBlanks(tokens, 'easy')
    const hardBlanks = selectBlanks(tokens, 'hard')
    expect(hardBlanks.length).toBeGreaterThanOrEqual(easyBlanks.length * 2)

    const avg = (blanks: typeof easyBlanks) =>
      blanks.reduce((s, b) => s + tokens[b.tokenIndex].text.length, 0) /
      (blanks.length || 1)

    expect(avg(hardBlanks)).toBeGreaterThanOrEqual(avg(easyBlanks) + 2)
  })

  it('positions spread across passage thirds — at least one blank in each third when count >= 3', () => {
    const tokens = tokenize(PARAGRAPH)
    const blanks = selectBlanks(tokens, 'hard')
    if (blanks.length < 3) return

    const wordTokens = tokens.filter((t) => t.isWord)
    const thirdLen = Math.floor(wordTokens.length / 3)

    const inFirst = blanks.some((b) => {
      const wordIdx = wordTokens.findIndex((t) => t === tokens[b.tokenIndex])
      return wordIdx < thirdLen
    })
    const inLast = blanks.some((b) => {
      const wordIdx = wordTokens.findIndex((t) => t === tokens[b.tokenIndex])
      return wordIdx >= thirdLen * 2
    })
    expect(inFirst).toBe(true)
    expect(inLast).toBe(true)
  })
})
