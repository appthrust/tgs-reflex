import { Pool } from "pg";
import type { Leaderboard } from "./scores";

const LEADERBOARD_LIMIT = 10;

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function getPool() {
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) {
    return null;
  }

  pool ??= new Pool({
    connectionString,
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return pool;
}

function ensureSchema(client: Pool) {
  schemaReady ??= client
    .query(
      `CREATE TABLE IF NOT EXISTS tgs_reflex_scores (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        average_ms INTEGER NOT NULL,
        best_ms INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
    )
    .then(() => undefined)
    .catch((error: unknown) => {
      schemaReady = undefined;
      throw error;
    });
  return schemaReady;
}

export async function loadLeaderboard(): Promise<Leaderboard> {
  const client = getPool();
  if (!client) {
    return { connected: false, entries: [] };
  }

  try {
    await ensureSchema(client);
    const result = await client.query<{
      id: number;
      name: string;
      average_ms: number;
      best_ms: number;
      created_at: string;
    }>(
      `SELECT id, name, average_ms, best_ms, created_at::text
       FROM (
         SELECT DISTINCT ON (name) id, name, average_ms, best_ms, created_at
         FROM tgs_reflex_scores
         ORDER BY name, average_ms ASC, best_ms ASC, id ASC
       ) best_per_name
       ORDER BY average_ms ASC, best_ms ASC, id ASC
       LIMIT $1`,
      [LEADERBOARD_LIMIT],
    );
    return {
      connected: true,
      entries: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        averageMs: row.average_ms,
        bestMs: row.best_ms,
        createdAt: row.created_at,
      })),
    };
  } catch {
    return { connected: false, entries: [] };
  }
}

export interface SavedScore {
  id: number;
  rank: number;
  total: number;
}

export async function insertScore(
  name: string,
  averageMs: number,
  bestMs: number,
): Promise<SavedScore | null> {
  const client = getPool();
  if (!client) {
    return null;
  }
  await ensureSchema(client);
  const inserted = await client.query<{ id: number }>(
    "INSERT INTO tgs_reflex_scores (name, average_ms, best_ms) VALUES ($1, $2, $3) RETURNING id",
    [name, averageMs, bestMs],
  );
  const id = inserted.rows[0].id;
  const ranked = await client.query<{ rank: string; total: string }>(
    `WITH best_per_name AS (
       SELECT DISTINCT ON (name) id, name, average_ms, best_ms
       FROM tgs_reflex_scores
       ORDER BY name, average_ms ASC, best_ms ASC, id ASC
     )
     SELECT
       (SELECT count(*) FROM best_per_name
        WHERE (average_ms, best_ms, id) < ($1::int, $2::int, $3::bigint)) + 1 AS rank,
       (SELECT count(*) FROM best_per_name) AS total`,
    [averageMs, bestMs, id],
  );
  return {
    id,
    rank: Number(ranked.rows[0].rank),
    total: Number(ranked.rows[0].total),
  };
}
