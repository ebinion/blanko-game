import type { Token, Blank, Difficulty } from './types'
import { difficultyConfig } from './difficulty'

export function selectBlanks(
  tokens: Token[],
  difficulty: Difficulty,
  options?: { sessionId?: string },
): Blank[] {
  const config = difficultyConfig(difficulty)
  const sessionId = options?.sessionId ?? 'preview'

  // Filter eligible word tokens by length constraints
  const eligible = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => {
      if (!token.isWord) return false
      const len = token.text.length
      if (len < config.minWordLength) return false
      if (config.maxWordLength !== undefined && len > config.maxWordLength)
        return false
      return true
    })

  if (eligible.length === 0) return []

  // Determine target count from density + cap
  const wordCount = tokens.filter((t) => t.isWord).length
  const targetCount = Math.min(
    Math.max(1, Math.round(wordCount * config.density)),
    config.blankCap,
    eligible.length,
  )

  // Stratified selection: divide eligible tokens into N equal buckets, pick one per bucket
  const N = targetCount
  const bucketSize = eligible.length / N
  const selected: { token: Token; index: number }[] = []

  for (let b = 0; b < N; b++) {
    const bucketStart = b * bucketSize
    const bucketEnd = (b + 1) * bucketSize
    const center = (bucketStart + bucketEnd) / 2

    // Find eligible token closest to bucket center
    let best = eligible[Math.floor(bucketStart)]
    let bestDist = Math.abs(Math.floor(bucketStart) - center)

    for (
      let j = Math.floor(bucketStart);
      j < Math.min(Math.ceil(bucketEnd), eligible.length);
      j++
    ) {
      const dist = Math.abs(j - center)
      if (dist < bestDist) {
        bestDist = dist
        best = eligible[j]
      }
    }

    if (!selected.find((s) => s.index === best.index)) {
      selected.push(best)
    }
  }

  // Sort by token index ascending
  selected.sort((a, b) => a.index - b.index)

  return selected.map(({ token, index }) => ({
    id: `${sessionId}-${index}`,
    tokenIndex: index,
    correctWord: token.text,
  }))
}
