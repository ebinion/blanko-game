import { describe, it, expect } from 'vitest'
import { difficultyConfig } from '~/engine/difficulty'

describe('difficultyConfig', () => {
  it('returns distinct configs for easy / medium / hard', () => {
    const easy = difficultyConfig('easy')
    const medium = difficultyConfig('medium')
    const hard = difficultyConfig('hard')
    expect(easy).not.toEqual(medium)
    expect(medium).not.toEqual(hard)
    expect(easy).not.toEqual(hard)
  })

  it('blankCap is 8 / 14 / 20', () => {
    expect(difficultyConfig('easy').blankCap).toBe(8)
    expect(difficultyConfig('medium').blankCap).toBe(14)
    expect(difficultyConfig('hard').blankCap).toBe(20)
  })

  it('density is 0.10 / 0.20 / 0.30', () => {
    expect(difficultyConfig('easy').density).toBeCloseTo(0.1)
    expect(difficultyConfig('medium').density).toBeCloseTo(0.2)
    expect(difficultyConfig('hard').density).toBeCloseTo(0.3)
  })

  it("Hard density and blankCap strictly exceed Easy's (FR-004 monotonicity)", () => {
    const easy = difficultyConfig('easy')
    const hard = difficultyConfig('hard')
    expect(hard.density).toBeGreaterThan(easy.density)
    expect(hard.blankCap).toBeGreaterThan(easy.blankCap)
  })
})
