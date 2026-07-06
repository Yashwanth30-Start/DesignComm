import type { NormalizedRecord } from "@/types/domain";

// Client-side persistence for imported pipeline records. Everything stays in
// the browser (IndexedDB) — nothing is ever uploaded, which is what lets the
// public deploy search real project data without exposing it.

const DB_NAME = "commissionos";
const DB_VERSION = 1;
const STORE = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecords(records: NormalizedRecord[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    for (const record of records) {
      tx.objectStore(STORE).add(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadStoredRecords(): Promise<NormalizedRecord[]> {
  const db = await openDb();
  const records = await new Promise<NormalizedRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as NormalizedRecord[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records;
}

export async function clearStoredRecords(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function parseRecordsJson(text: string): NormalizedRecord[] {
  // PowerShell 5.1 Out-File -Encoding utf8 writes a BOM; JSON.parse rejects it.
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const parsed = JSON.parse(cleaned);
  const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  return list.filter(
    (item): item is NormalizedRecord =>
      typeof item === "object" && item !== null && "primaryLabel" in item && "source" in item
  );
}
