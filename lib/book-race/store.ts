import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync as SQLiteDatabase } from "node:sqlite";
import { createRequire } from "node:module";
import { RaceError, freshSession, type Session } from "./core";
let db: SQLiteDatabase | undefined;
function local() {
  if (process.env.VERCEL)
    throw new RaceError(
      503,
      "Configure RACE_REDIS_REST_URL and RACE_REDIS_REST_TOKEN for hosted races.",
    );
  if (!db) {
    const folder =
      process.env.RACE_DATA_DIR || join(process.cwd(), ".race-data");
    mkdirSync(folder, { recursive: true });
    const { DatabaseSync } = createRequire(join(process.cwd(), "package.json"))(
      "node:sqlite",
    ) as typeof import("node:sqlite");
    db = new DatabaseSync(join(folder, "races.sqlite"));
    db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS races (id TEXT PRIMARY KEY, body TEXT NOT NULL, expires INTEGER NOT NULL)",
    );
  }
  return db;
}
const redisUrl = () =>
  process.env.RACE_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () =>
  process.env.RACE_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
async function redis(command: (string | number)[]) {
  const response = await fetch(redisUrl()!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new RaceError(503, "Race storage is unavailable.");
  const data = await response.json();
  if (data.error)
    throw new RaceError(503, "Race storage rejected the request.");
  return data.result;
}
function remote() {
  if (Boolean(redisUrl()) !== Boolean(redisToken()))
    throw new RaceError(503, "Both race Redis settings are required.");
  return Boolean(redisUrl());
}
const storageKey = (id: string) => `blog:book:martin-six-facts-v1:${id}`;
export async function loadSession(id: string): Promise<Session> {
  if (id !== "live" && !/^[a-f0-9-]{36}$/.test(id))
    throw new RaceError(404, "Race not found.");
  const body = remote()
    ? await redis(["GET", storageKey(id)])
    : (
        local()
          .prepare("SELECT body FROM races WHERE id = ? AND expires > ?")
          .get(storageKey(id), Date.now()) as { body: string } | undefined
      )?.body;
  if (!body)
    throw new RaceError(404, "Race not found or expired. Create a new race.");
  return JSON.parse(body);
}
export async function liveSession(): Promise<Session> {
  const initial = freshSession();
  if (remote())
    await redis(["SET", storageKey("live"), JSON.stringify(initial), "NX"]);
  else
    local()
      .prepare("INSERT OR IGNORE INTO races VALUES (?, ?, ?)")
      .run(storageKey("live"), JSON.stringify(initial), 8640000000000000);
  return loadSession("live");
}
export async function resetSession(expectedRound: string) {
  await liveSession();
  return updateSession("live", (race) => {
    if (race.id !== expectedRound)
      throw new RaceError(
        409,
        "The board was already reset. Refresh before resetting again.",
      );
    Object.assign(race, freshSession());
    return race;
  });
}
export async function updateSession<T>(
  id: string,
  change: (race: Session) => T,
): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const race = await loadSession(id);
    const before = JSON.stringify(race);
    const result = change(race);
    const after = JSON.stringify(race);
    if (before === after) return result;
    const changed = remote()
      ? await redis([
          "EVAL",
          "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'KEEPTTL'); return 1 else return 0 end",
          1,
          storageKey(id),
          before,
          after,
        ])
      : local()
          .prepare(
            "UPDATE races SET body = ? WHERE id = ? AND body = ? AND expires > ?",
          )
          .run(after, storageKey(id), before, Date.now()).changes;
    if (Number(changed) === 1) return result;
  }
  throw new RaceError(
    409,
    "Race updated concurrently. Inspect your lane and try again.",
  );
}
