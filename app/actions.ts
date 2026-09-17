"use server";

import { insertScore, loadLeaderboard } from "@/lib/db";
import {
  MAX_MS,
  MAX_NAME_LENGTH,
  MIN_MS,
  ROUNDS,
  type Leaderboard,
} from "@/lib/scores";

function clampMs(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MAX_MS;
  }
  return Math.min(Math.max(Math.round(value), MIN_MS), MAX_MS);
}

export interface SubmitResult {
  board: Leaderboard;
  savedId: number | null;
  rank: number | null;
  total: number | null;
}

export async function submitScore(
  rawName: string,
  rawTimes: number[],
): Promise<SubmitResult> {
  const name = rawName.trim().slice(0, MAX_NAME_LENGTH) || "anonymous";
  const times = Array.isArray(rawTimes)
    ? rawTimes.slice(0, ROUNDS).map(clampMs)
    : [];

  let saved = null;
  if (times.length === ROUNDS) {
    const averageMs = Math.round(
      times.reduce((sum, t) => sum + t, 0) / times.length,
    );
    const bestMs = Math.min(...times);
    saved = await insertScore(name, averageMs, bestMs);
  }

  return {
    board: await loadLeaderboard(),
    savedId: saved?.id ?? null,
    rank: saved?.rank ?? null,
    total: saved?.total ?? null,
  };
}
