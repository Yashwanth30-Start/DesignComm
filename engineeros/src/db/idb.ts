/**
 * Minimal IndexedDB helpers. Two stores:
 *  - "sqlite": the exported SQLite database bytes (key "main").
 *  - "handles": FileSystemDirectoryHandle objects for watched folders.
 */
const DB_NAME = "engineeros";
const DB_VERSION = 1;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sqlite")) db.createObjectStore("sqlite");
      if (!db.objectStoreNames.contains("handles")) db.createObjectStore("handles");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | IDBRequest
): Promise<T> {
  const db = await openIdb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return withStore<T | undefined>(store, "readonly", (s) => s.get(key));
}

export function idbSet(store: string, key: string, value: unknown): Promise<unknown> {
  return withStore(store, "readwrite", (s) => s.put(value as never, key));
}

export function idbDelete(store: string, key: string): Promise<unknown> {
  return withStore(store, "readwrite", (s) => s.delete(key));
}

export function idbKeys(store: string): Promise<string[]> {
  return withStore<string[]>(store, "readonly", (s) => s.getAllKeys() as IDBRequest<string[]>);
}
