import { useMemo, useRef, useState } from "react";
import { FilePlus2, FolderPlus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useData } from "../state/DataProvider";
import { documents, projects } from "../db/repo";
import {
  Button,
  EmptyState,
  GlassPanel,
  Input,
  SectionHeading,
  Select
} from "../components/ui/primitives";
import {
  indexPickedFiles,
  listWatchedFolders,
  pickWatchedFolder,
  removeWatchedFolder,
  rescanAll,
  supportsFolderWatching,
  type ScanReport
} from "../lib/documents";
import { relativeTime } from "../lib/dates";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Document index: watched folders (File System Access API) or manually
 * picked files. Only metadata + extracted text is stored — EngineerOS is an
 * index, not another file repository.
 */
export default function Documents() {
  const { db, version, mutate, settings } = useData();
  const [query, setQuery] = useState("");
  const [folders, setFolders] = useState<string[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reports, setReports] = useState<ScanReport[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const canWatch = supportsFolderWatching();

  // Load watched folder names once (async IndexedDB read).
  if (folders === null) {
    void listWatchedFolders().then(setFolders);
  }

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .all(db)
      .filter(
        (d) => !q || `${d.name} ${d.path} ${d.contentText}`.toLowerCase().includes(q)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, query]);

  const projectList = projects.all(db);

  const addFolder = async () => {
    try {
      await pickWatchedFolder();
      setFolders(await listWatchedFolders());
      await rescan();
    } catch {
      // user cancelled the picker
    }
  };

  const rescan = async () => {
    setScanning(true);
    try {
      const result = await rescanAll(db, settings.documentExtensions);
      setReports(result);
      mutate(() => undefined); // persist + re-render after the scan wrote rows
    } finally {
      setScanning(false);
    }
  };

  const removeFolder = async (name: string) => {
    if (!window.confirm(`Stop watching "${name}" and remove its indexed entries?`)) return;
    await removeWatchedFolder(name);
    setFolders(await listWatchedFolders());
    mutate((d) => documents.removeFolder(d, name));
  };

  const importFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setScanning(true);
    try {
      const report = await indexPickedFiles(db, files, settings.documentExtensions);
      setReports([report]);
      mutate(() => undefined);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Documents</h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            Metadata index with revision tracking — files stay where they are.
          </p>
        </div>
        <div className="flex gap-2">
          {canWatch && (
            <>
              <Button variant="primary" onClick={addFolder}>
                <FolderPlus size={14} /> Watch folder
              </Button>
              <Button onClick={rescan} disabled={scanning || (folders ?? []).length === 0}>
                <RefreshCw size={14} className={scanning ? "animate-spin" : ""} /> Rescan
              </Button>
            </>
          )}
          <Button onClick={() => fileInput.current?.click()}>
            <FilePlus2 size={14} /> Index files
          </Button>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void importFiles(e.target.files)}
          />
        </div>
      </div>

      {!canWatch && (
        <GlassPanel className="border-gold/20 p-4">
          <p className="text-xs text-gold">
            This browser doesn't support watched folders (File System Access API — available
            in Chrome/Edge). Use "Index files" to add documents manually.
          </p>
        </GlassPanel>
      )}

      {(folders ?? []).length > 0 && (
        <GlassPanel className="p-4">
          <SectionHeading title="Watched folders" />
          <div className="flex flex-wrap gap-2">
            {(folders ?? []).map((f) => (
              <span
                key={f}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ink"
              >
                {f}
                <button
                  onClick={() => void removeFolder(f)}
                  className="text-ink-dim2 hover:text-red"
                  aria-label={`Stop watching ${f}`}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
          {reports.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
              {reports.map((r) => (
                <p key={r.folder} className="text-[11px] text-ink-dim2">
                  <span className="text-ink-dim">{r.folder}:</span>{" "}
                  {r.error ? (
                    <span className="text-red">{r.error}</span>
                  ) : (
                    `${r.added} added · ${r.updated} updated · ${r.unchanged} unchanged · ${r.skipped} skipped`
                  )}
                </p>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      <div className="relative max-w-md">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim2" />
        <Input
          className="pl-8"
          placeholder="Search indexed documents and their text…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {docs.length === 0 ? (
        <EmptyState
          message="Nothing indexed yet."
          hint={
            canWatch
              ? "Add a watched folder or index individual files."
              : "Index individual files to get started."
          }
        />
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-[10px] uppercase tracking-[0.15em] text-ink-dim">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Rev</th>
                <th className="px-4 py-3">Indexed</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-ink">{d.name}</td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 font-mono text-[11px] text-ink-dim2">
                    {d.path}
                  </td>
                  <td className="px-4 py-2.5 text-ink-dim">{formatSize(d.size)}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-purple/30 bg-purple/10 px-2 py-0.5 text-[10px] text-purple">
                      rev {d.revision}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-ink-dim2">
                    {relativeTime(d.indexedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Select
                      className="!py-1 text-xs"
                      value={d.projectId ?? ""}
                      onChange={(e) =>
                        mutate((dd) => documents.setProject(dd, d.id, e.target.value || null))
                      }
                    >
                      <option value="">—</option>
                      {projectList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => mutate((dd) => documents.remove(dd, d.id))}
                      className="text-ink-dim2 hover:text-red"
                      aria-label={`Remove ${d.name} from index`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
