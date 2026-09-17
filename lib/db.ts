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
       FROM tgs_reflex_scores
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

export async function insertScore(
  name: string,
  averageMs: number,
  bestMs: number,
) {
  const client = getPool();
  if (!client) {
    return;
  }
  await ensureSchema(client);
  await client.query(
    "INSERT INTO tgs_reflex_scores (name, average_ms, best_ms) VALUES ($1, $2, $3)",
    [name, averageMs, bestMs],
  );
}
