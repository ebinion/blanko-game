import { describe, it, expect } from 'vitest'
import { tokenize } from '~/engine/tokenize'

describe('tokenize', () => {
  it('ASCII passage tokenizes with words and spaces', () => {
    const tokens = tokenize('hello world')
    const words = tokens.filter((t) => t.isWord)
    expect(words.length).toBeGreaterThanOrEqual(2)
    expect(words.map((t) => t.text)).toContain('hello')
    expect(words.map((t) => t.text)).toContain('world')
  })

  it('tokens joined equals original passage', () => {
    const passage = 'The quick brown fox jumps.'
    const tokens = tokenize(passage)
    expect(tokens.map((t) => t.text).join('')).toBe(passage)
  })

  it("don't is one isWord: true token", () => {
    const tokens = tokenize("I don't know")
    const words = tokens.filter((t) => t.isWord)
    expect(words.map((t) => t.text)).toContain("don't")
  })

  it('well-known is one isWord: true token', () => {
    const tokens = tokenize('She is well-known here')
    const words = tokens.filter((t) => t.isWord)
    expect(words.map((t) => t.text)).toContain('well-known')
  })

  it('Chinese sample yields one token per ideograph each isWord: true', () => {
    const passage = '北京是中国'
    const tokens = tokenize(passage)
    const words = tokens.filter((t) => t.isWord)
    expect(words.length).toBe(5)
    expect(words.every((t) => t.text.length === 1)).toBe(true)
  })

  it('French passage with école preserves accented characters in token text', () => {
    const passage = "aller à l'école maintenant"
    const tokens = tokenize(passage)
    const words = tokens.filter((t) => t.isWord)
    // The accented character must be preserved — either as its own token or as part of a contraction
    const allWordText = words.map((t) => t.text).join(' ')
    expect(allWordText).toMatch(/école/)
  })

  it('empty string returns []', () => {
    expect(tokenize('')).toEqual([])
  })

  it('tokens are sorted by start', () => {
    const tokens = tokenize('hello world test')
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].start).toBeGreaterThanOrEqual(tokens[i - 1].start)
    }
  })
})
