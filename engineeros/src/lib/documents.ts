import type { Database } from "sql.js";
import { documents } from "../db/repo";
import { idbDelete, idbGet, idbKeys, idbSet } from "../db/idb";

/**
 * Watched-folder indexing via the File System Access API (Chromium/Edge).
 * EngineerOS indexes metadata and extracts searchable text from plain-text
 * formats — it never copies files, so it can't become another file
 * repository. Directory handles persist in IndexedDB across sessions.
 *
 * On browsers without the API (iPad Safari), the Documents page falls back
 * to indexing individually picked files.
 */

const TEXT_EXTENSIONS = new Set([
  "md", "txt", "csv", "json", "js", "ts", "tsx", "html", "css", "py", "log", "yml", "yaml"
]);
const MAX_TEXT_BYTES = 512 * 1024; // extract text only from files up to 512 KB
const MAX_DEPTH = 6;
const MAX_FILES_PER_SCAN = 2000;

export function supportsFolderWatching(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function pickWatchedFolder(): Promise<string | null> {
  const w = window as unknown as {
    showDirectoryPicker(opts?: { mode?: string }): Promise<FileSystemDirectoryHandle>;
  };
  const handle = await w.showDirectoryPicker({ mode: "read" });
  await idbSet("handles", handle.name, handle);
  return handle.name;
}

export async function listWatchedFolders(): Promise<string[]> {
  return idbKeys("handles");
}

export async function removeWatchedFolder(name: string): Promise<void> {
  await idbDelete("handles", name);
}

export interface ScanReport {
  folder: string;
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
  error?: string;
}

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as unknown as {
    queryPermission?(o: { mode: string }): Promise<string>;
    requestPermission?(o: { mode: string }): Promise<string>;
  };
  if (!h.queryPermission) return true;
  if ((await h.queryPermission({ mode: "read" })) === "granted") return true;
  if (!h.requestPermission) return false;
  return (await h.requestPermission({ mode: "read" })) === "granted";
}

async function indexFile(
  db: Database,
  file: File,
  path: string,
  folder: string,
  allowedExts: string[]
): Promise<"added" | "updated" | "unchanged" | "skipped"> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (allowedExts.length && !allowedExts.includes(ext)) return "skipped";

  let contentText = "";
  if (TEXT_EXTENSIONS.has(ext) && file.size <= MAX_TEXT_BYTES) {
    try {
      contentText = await file.text();
    } catch {
      contentText = "";
    }
  }
  return documents.upsert(db, {
    name: file.name,
    path,
    folder,
    ext,
    size: file.size,
    modifiedAt: new Date(file.lastModified).toISOString(),
    contentText
  });
}

async function walk(
  db: Database,
  dir: FileSystemDirectoryHandle,
  prefix: string,
  rootFolder: string,
  allowedExts: string[],
  report: ScanReport,
  depth: number,
  budget: { files: number }
): Promise<void> {
  if (depth > MAX_DEPTH || budget.files <= 0) return;
  // entries() is not yet in the TS lib for FileSystemDirectoryHandle.
  const iter = (dir as unknown as {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }).entries();
  for await (const [name, handle] of iter) {
    if (budget.files <= 0) return;
    if (name.startsWith(".")) continue;
    const path = `${prefix}/${name}`;
    if (handle.kind === "file") {
      budget.files--;
      const file = await (handle as FileSystemFileHandle).getFile();
      const outcome = await indexFile(db, file, path, rootFolder, allowedExts);
      report[outcome]++;
    } else if (handle.kind === "directory") {
      await walk(
        db,
        handle as FileSystemDirectoryHandle,
        path,
        rootFolder,
        allowedExts,
        report,
        depth + 1,
        budget
      );
    }
  }
}

/** Rescan every watched folder; returns one report per folder. */
export async function rescanAll(db: Database, allowedExts: string[]): Promise<ScanReport[]> {
  const names = await listWatchedFolders();
  const reports: ScanReport[] = [];
  for (const name of names) {
    const report: ScanReport = { folder: name, added: 0, updated: 0, unchanged: 0, skipped: 0 };
    const handle = await idbGet<FileSystemDirectoryHandle>("handles", name);
    if (!handle) {
      report.error = "Folder handle missing";
      reports.push(report);
      continue;
    }
    try {
      if (!(await ensurePermission(handle))) {
        report.error = "Permission denied — re-grant access from the browser prompt";
        reports.push(report);
        continue;
      }
      await walk(db, handle, name, name, allowedExts, report, 0, {
        files: MAX_FILES_PER_SCAN
      });
    } catch (e) {
      report.error = e instanceof Error ? e.message : String(e);
    }
    reports.push(report);
  }
  return reports;
}

/** Fallback for browsers without the File System Access API. */
export async function indexPickedFiles(
  db: Database,
  files: FileList,
  allowedExts: string[]
): Promise<ScanReport> {
  const report: ScanReport = {
    folder: "Imported files",
    added: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0
  };
  for (const file of Array.from(files)) {
    const outcome = await indexFile(
      db,
      file,
      `imported/${file.name}`,
      "Imported files",
      allowedExts
    );
    report[outcome]++;
  }
  return report;
}
