"use client";

import { useRef } from "react";
import { Database, Loader2, X } from "lucide-react";

import { useProjectData } from "./DataProvider";

// Loads pipeline/output/*.json files entirely in the browser (IndexedDB).
// The data never leaves this machine — that's what makes real project data
// searchable on a public deploy without exposing it.
export function ConnectDataButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { recordCount, importing, importFiles, clearAll } = useProjectData();

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            void importFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title="Load pipeline/output/*.json — data stays in this browser only"
        className="flex items-center gap-1.5 rounded-md border border-glass-border-hi bg-glass px-2.5 py-1.5 text-[11px] font-medium text-ink-dim transition-colors hover:border-cyan/40 hover:text-ink"
      >
        {importing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Database className="h-3.5 w-3.5" strokeWidth={1.8} />
        )}
        {recordCount > 0 ? `${recordCount.toLocaleString()} records` : "Connect data"}
      </button>
      {recordCount > 0 && (
        <button
          onClick={() => void clearAll()}
          title="Clear imported data from this browser"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-glass hover:text-red"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
