import { Input } from '~/components/ui/input'
import type { Session } from '~/engine/types'

type PassageViewProps = {
  session: Session
  answers?: Record<string, string>
  onAnswerChange: (blankId: string, value: string) => void
  onBlur?: (blankId: string, value: string) => void
}

export function PassageView({
  session,
  answers,
  onAnswerChange,
  onBlur,
}: PassageViewProps) {
  const { tokens, blanks } = session
  // Allow caller to provide live answers (local state); fall back to persisted answers
  const currentAnswers = answers ?? session.answers

  const blanksByTokenIndex = new Map(
    blanks.map((b, i) => [b.tokenIndex, { blank: b, num: i + 1 }]),
  )
  const totalBlanks = blanks.length

  return (
    <div className="text-lg leading-loose sm:text-xl">
      {tokens.map((token, idx) => {
        const blankInfo = blanksByTokenIndex.get(idx)
        if (blankInfo) {
          const { blank, num } = blankInfo
          const prevWord = tokens
            .slice(0, idx)
            .filter((t) => t.isWord)
            .slice(-2)
            .map((t) => t.text)
            .join(' ')
          const ariaLabel = `blank ${num} of ${totalBlanks}${prevWord ? `: word after "${prevWord}"` : ''}. Correct word is "${blank.correctWord}"`
          return (
            <Input
              key={blank.id}
              className="mx-1 inline-block h-9 w-auto min-w-[7ch] rounded-lg border-2 bg-background px-2 py-0 text-center text-base align-baseline font-semibold shadow-none"
              aria-label={ariaLabel}
              value={currentAnswers[blank.id] ?? ''}
              onChange={(e) => onAnswerChange(blank.id, e.target.value)}
              onBlur={(e) => onBlur?.(blank.id, e.target.value)}
            />
          )
        }
        return <span key={`${token.start}-${token.end}`}>{token.text}</span>
      })}
    </div>
  )
}
