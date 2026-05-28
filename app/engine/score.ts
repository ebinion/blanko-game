import type { Session, Result } from "./types";

export function scoreSession(session: Session): Result {
  const total = session.blanks.length;
  let correct = 0;
  const incorrect = [];

  for (const blank of session.blanks) {
    const userAnswer = session.answers[blank.id] ?? "";
    const a = userAnswer.trim().normalize("NFC").toLocaleLowerCase();
    const b = blank.correctWord.normalize("NFC").toLocaleLowerCase();

    if (a.length > 0 && a === b) {
      correct++;
    } else {
      incorrect.push({
        blankId: blank.id,
        userAnswer,
        correctWord: blank.correctWord,
      });
    }
  }

  return { score: { correct, total }, incorrect };
}
