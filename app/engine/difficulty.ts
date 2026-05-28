import type { Difficulty } from "./types";

export type DifficultyConfig = {
  density: number;
  minWordLength: number;
  maxWordLength?: number;
  blankCap: number;
};

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { density: 0.1, minWordLength: 1, maxWordLength: 5, blankCap: 8 },
  medium: { density: 0.2, minWordLength: 3, maxWordLength: 8, blankCap: 14 },
  hard: { density: 0.3, minWordLength: 6, blankCap: 20 },
};

export function difficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return CONFIGS[difficulty];
}
