import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Database } from "sql.js";
import { openDatabase, schedulePersist } from "../db/database";
import { settings as settingsRepo } from "../db/repo";
import type { AppSettings } from "../types";

/**
 * App-wide data context. Reads go straight to the in-memory SQLite database;
 * writes go through `mutate`, which persists the snapshot and bumps a version
 * counter so every page re-queries. With a single local user and an in-memory
 * engine, re-querying on write is simpler and plenty fast.
 */

interface DataContextValue {
  db: Database;
  /** Increments after every write — pages depend on it to re-query. */
  version: number;
  mutate: (fn: (db: Database) => void) => void;
  settings: AppSettings;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    openDatabase()
      .then(setDb)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const mutate = useCallback(
    (fn: (database: Database) => void) => {
      if (!db) return;
      fn(db);
      schedulePersist();
      setVersion((v) => v + 1);
    },
    [db]
  );

  const value = useMemo<DataContextValue | null>(() => {
    if (!db) return null;
    return { db, version, mutate, settings: settingsRepo.get(db) };
  }, [db, version, mutate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void p-8 text-center">
        <div>
          <p className="text-lg text-red">Failed to open the local database</p>
          <p className="mt-2 text-sm text-ink-dim">{error}</p>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          <p className="text-sm tracking-widest text-ink-dim">STARTING ENGINEEROS</p>
        </div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
