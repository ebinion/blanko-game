import { Input } from "~/components/ui/input";
import type { Session } from "~/engine/types";

type PassageViewProps = {
  session: Session;
  answers?: Record<string, string>;
  onAnswerChange: (blankId: string, value: string) => void;
  onBlur?: (blankId: string, value: string) => void;
};

export function PassageView({ session, answers, onAnswerChange, onBlur }: PassageViewProps) {
  const { tokens, blanks } = session;
  // Allow caller to provide live answers (local state); fall back to persisted answers
  const currentAnswers = answers ?? session.answers;

  const blanksByTokenIndex = new Map(blanks.map((b, i) => [b.tokenIndex, { blank: b, num: i + 1 }]));
  const totalBlanks = blanks.length;

  return (
    <div className="leading-loose text-base">
      {tokens.map((token, idx) => {
        const blankInfo = blanksByTokenIndex.get(idx);
        if (blankInfo) {
          const { blank, num } = blankInfo;
          const prevWord = tokens
            .slice(0, idx)
            .filter((t) => t.isWord)
            .slice(-2)
            .map((t) => t.text)
            .join(" ");
          const ariaLabel = `Blank ${num} of ${totalBlanks}${prevWord ? `: word after "${prevWord}"` : ""}. Correct word is "${blank.correctWord}"`;
          return (
            <Input
              key={blank.id}
              className="inline-block w-auto min-w-[6ch] mx-1 h-7 py-0 text-base align-baseline"
              aria-label={ariaLabel}
              value={currentAnswers[blank.id] ?? ""}
              onChange={(e) => onAnswerChange(blank.id, e.target.value)}
              onBlur={(e) => onBlur?.(blank.id, e.target.value)}
            />
          );
        }
        return (
          <span key={`${token.start}-${token.end}`}>{token.text}</span>
        );
      })}
    </div>
  );
}
