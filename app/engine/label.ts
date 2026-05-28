import { tokenize } from './tokenize'

export function labelSession(passage: string, createdAt: Date): string {
  const tokens = tokenize(passage)
  const words = tokens.filter((t) => t.isWord).slice(0, 4)
  const dateStr = createdAt.toISOString().slice(0, 10)

  const prefix =
    words.length > 0 ? words.map((t) => t.text).join(' ') : '(untitled)'
  const label = `${prefix} · ${dateStr}`
  return label.length > 80 ? label.slice(0, 80) : label
}
