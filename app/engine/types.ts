export type Difficulty = 'easy' | 'medium' | 'hard'

export type Token = {
  text: string
  start: number
  end: number
  isWord: boolean
}

export type Blank = {
  id: string
  tokenIndex: number
  correctWord: string
}

export type IncorrectEntry = {
  blankId: string
  userAnswer: string
  correctWord: string
}

export type Result = {
  score: {
    correct: number
    total: number
  }
  incorrect: IncorrectEntry[]
}

export type Session = {
  id: string
  createdAt: string
  label: string
  practiceText: string
  difficulty: Difficulty
  tokens: Token[]
  blanks: Blank[]
  answers: Record<string, string>
  status: 'in_progress' | 'completed'
  result?: Result
}

export type Settings = {
  lastDifficulty: Difficulty
}

export type Store = {
  schemaVersion: 1
  settings: Settings
  sessions: Session[]
}
