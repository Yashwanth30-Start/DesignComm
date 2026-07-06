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
  const records = await new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as unknown[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  // Sanitize on read too, so data imported before sanitization existed heals
  // without a re-import.
  return records.map(sanitizeRecord).filter((record): record is NormalizedRecord => record !== null);
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

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function toStringArray(value: unknown): string[] {
  // PowerShell 5.1's ConvertTo-Json can emit a lone string (or null entries)
  // where the contract says string[]; normalize all of those shapes.
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item !== "");
  }
  if (typeof value === "string" && value !== "") return [value];
  return [];
}

// Pipeline output can contain nulls (empty spreadsheet cells become null
// labels/keys). Everything downstream assumes strings, so records are
// normalized here — the single choke point for both import and load.
export function sanitizeRecord(item: unknown): NormalizedRecord | null {
  if (typeof item !== "object" || item === null) return null;
  const value = item as Record<string, unknown>;
  const source = asOptionalString(value.source);
  const sourceRecordId = asOptionalString(value.sourceRecordId) ?? "";
  const primaryLabel = asOptionalString(value.primaryLabel) ?? sourceRecordId;
  if (!source || !primaryLabel) return null;

  return {
    source,
    sourceRecordId,
    sourcePath: asOptionalString(value.sourcePath) ?? "",
    sourceSheet: asOptionalString(value.sourceSheet),
    recordType: asOptionalString(value.recordType) ?? "record",
    primaryLabel,
    secondaryLabel: asOptionalString(value.secondaryLabel),
    status: asOptionalString(value.status),
    area: asOptionalString(value.area),
    location: asOptionalString(value.location),
    trade: asOptionalString(value.trade),
    assetKeys: toStringArray(value.assetKeys),
    panelKeys: toStringArray(value.panelKeys),
    circuitKeys: toStringArray(value.circuitKeys),
    rfiKeys: toStringArray(value.rfiKeys),
    searchText: asOptionalString(value.searchText),
    raw: typeof value.raw === "object" ? (value.raw as Record<string, unknown> | null) : null,
  };
}

export function parseRecordsJson(text: string): NormalizedRecord[] {
  // PowerShell 5.1 Out-File -Encoding utf8 writes a BOM; JSON.parse rejects it.
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const parsed = JSON.parse(cleaned);
  const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  return list.map(sanitizeRecord).filter((record): record is NormalizedRecord => record !== null);
}
