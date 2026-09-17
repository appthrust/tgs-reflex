export interface ScoreEntry {
  id: number;
  name: string;
  averageMs: number;
  bestMs: number;
  createdAt: string;
}

export interface Leaderboard {
  connected: boolean;
  entries: ScoreEntry[];
}

export const ROUNDS = 5;
export const MAX_NAME_LENGTH = 16;
export const MIN_MS = 80;
export const MAX_MS = 5000;
export const MIN_WAIT_MS = 1000;
export const MAX_WAIT_MS = 4000;
