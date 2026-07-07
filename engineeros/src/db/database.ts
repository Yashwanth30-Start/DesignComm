import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { MIGRATIONS } from "./schema";
import { idbGet, idbSet } from "./idb";
import { seedIfEmpty } from "./seed";

/**
 * Local-first storage: a real SQLite database (sql.js / WASM) held in memory
 * and persisted as a byte snapshot to IndexedDB after every write (debounced).
 * The whole engine is precached by the service worker, so the app is fully
 * functional offline.
 *
 * A desktop shell (Version 2+) can reuse everything above this module by
 * swapping the persistence target from IndexedDB to a file on disk.
 */

const SNAPSHOT_KEY = "main";
let db: Database | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export async function openDatabase(): Promise<Database> {
  if (db) return db;
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = await idbGet<Uint8Array>("sqlite", SNAPSHOT_KEY);
  db = saved ? new SQL.Database(saved) : new SQL.Database();
  migrate(db);
  seedIfEmpty(db);
  await persistNow();

  // Belt-and-braces: flush pending writes when the tab goes to background.
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void persistNow();
    });
  }
  return db;
}

function migrate(database: Database): void {
  database.run("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  const res = database.exec("SELECT value FROM meta WHERE key='schema_version'");
  const current = res.length ? Number(res[0].values[0][0]) : 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    database.exec(MIGRATIONS[v]);
    database.run(
      "INSERT INTO meta(key,value) VALUES('schema_version',?) " +
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [String(v + 1)]
    );
  }
}

/** Schedule a persist ~400ms after the last write, coalescing bursts. */
export function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void persistNow(), 400);
}

export async function persistNow(): Promise<void> {
  if (!db) return;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  await idbSet("sqlite", SNAPSHOT_KEY, db.export());
}

/** Export the raw SQLite file (for backup from Settings). */
export function exportBytes(): Uint8Array {
  if (!db) throw new Error("Database not open");
  return db.export();
}

/** Replace the database with an imported SQLite file, then re-migrate. */
export async function importBytes(bytes: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const next = new SQL.Database(bytes);
  migrate(next);
  db?.close();
  db = next;
  await persistNow();
}

/** Wipe all data and start fresh (Settings → danger zone). */
export async function resetDatabase(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  db?.close();
  db = new SQL.Database();
  migrate(db);
  seedIfEmpty(db);
  await persistNow();
}

/** Query helper: rows as objects keyed by column name. */
export function rows<T = Record<string, unknown>>(
  database: Database,
  sql: string,
  params: (string | number | null)[] = []
): T[] {
  const stmt = database.prepare(sql);
  try {
    stmt.bind(params);
    const out: T[] = [];
    while (stmt.step()) out.push(stmt.getAsObject() as T);
    return out;
  } finally {
    stmt.free();
  }
}

export function run(
  database: Database,
  sql: string,
  params: (string | number | null)[] = []
): void {
  database.run(sql, params);
}
