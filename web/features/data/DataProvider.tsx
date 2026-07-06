"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { NormalizedRecord } from "@/types/domain";
import { saveRecords, loadStoredRecords, clearStoredRecords, parseRecordsJson } from "@/lib/record-store";

interface DataContextValue {
  records: NormalizedRecord[];
  recordCount: number;
  importing: boolean;
  importFiles: (files: FileList | File[]) => Promise<void>;
  clearAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  records: [],
  recordCount: 0,
  importing: false,
  importFiles: async () => {},
  clearAll: async () => {},
});

export function useProjectData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadStoredRecords()
      .then((stored) => {
        if (stored.length > 0) setRecords(stored);
      })
      .catch(() => {
        // IndexedDB unavailable (private mode, etc.) — search just runs on mock data.
      });
  }, []);

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      setImporting(true);
      try {
        const imported: NormalizedRecord[] = [];
        for (const file of Array.from(files)) {
          const text = await file.text();
          imported.push(...parseRecordsJson(text));
        }
        // Merge with whatever is already loaded, replacing records from the
        // same source so re-importing a fresh export doesn't duplicate.
        const importedSources = new Set(imported.map((record) => record.source));
        const merged = [...records.filter((record) => !importedSources.has(record.source)), ...imported];
        setRecords(merged);
        await saveRecords(merged).catch(() => {});
      } finally {
        setImporting(false);
      }
    },
    [records]
  );

  const clearAll = useCallback(async () => {
    setRecords([]);
    await clearStoredRecords().catch(() => {});
  }, []);

  return (
    <DataContext.Provider
      value={{ records, recordCount: records.length, importing, importFiles, clearAll }}
    >
      {children}
    </DataContext.Provider>
  );
}
