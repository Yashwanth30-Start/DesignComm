"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Zap,
  AlertTriangle,
  CalendarClock,
  Flame,
  ClipboardCheck,
  Activity,
  Hammer,
} from "lucide-react";

import { GlassPanel, StatusPill, ProgressBar } from "@/components/ui";
import type { NormalizedRecord } from "@/types/domain";
import { useProjectData } from "@/features/data/DataProvider";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { recordDate, formatDate } from "@/lib/dates";

// The homepage answers one question: "What should I work on today?"
// Layout mirrors the field sketch — universal search on top, six scannable
// tiles, and a live activity feed. Compact cards only; never full tables.

interface FeedItem {
  record: NormalizedRecord;
  date: number;
}

function haystack(record: NormalizedRecord): string {
  return (
    record.searchText ??
    `${record.primaryLabel} ${record.secondaryLabel ?? ""} ${record.status ?? ""}`.toLowerCase()
  );
}

const LIFE_SAFETY = /\b(fsd|facu|fa-\d|fire alarm|smoke|damper)\b/;

function TileHeading({
  icon: Icon,
  label,
  accent,
  count,
}: {
  icon: typeof Zap;
  label: string;
  accent: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b border-glass-border pb-2">
      <span className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {typeof count === "number" && <span className="text-[10px] text-ink-dim">{count}</span>}
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-glass-border py-2 text-[11px] first:border-t-0">
      <span className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-cyan/70" />
      <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-dim2">
        {item.record.source.split(" ").find((w) => w.length > 0) ?? item.record.source}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink">{item.record.primaryLabel}</span>
      {item.date > 0 && <span className="shrink-0 font-mono text-ink-dim2">{formatDate(item.date)}</span>}
    </div>
  );
}

export function CommandCenter() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { records, recordCount } = useProjectData();

  const model = useMemo(() => {
    const now = Date.now();
    const horizon = now + 21 * 24 * 60 * 60 * 1000;

    const openConstraints: FeedItem[] = [];
    const energizations: FeedItem[] = [];
    const upcoming: FeedItem[] = [];
    const lifeSafety: FeedItem[] = [];
    const feed: FeedItem[] = [];

    for (const record of records) {
      if (record.recordType === "panel_circuit" || record.recordType === "panel_schedule") continue;
      const date = recordDate(record);
      const item: FeedItem = { record, date };

      if (record.source === "Cx Constraint Log" && !/closed|complete/i.test(record.status ?? "")) {
        openConstraints.push(item);
      }
      if (record.source === "GroupMe" && haystack(record).includes("energiz")) {
        energizations.push(item);
      }
      if (date > now && date < horizon) {
        upcoming.push(item);
      }
      if (LIFE_SAFETY.test(haystack(record))) {
        lifeSafety.push(item);
      }
      if (date > 0) feed.push(item);
    }

    const byDateDesc = (a: FeedItem, b: FeedItem) => b.date - a.date;
    openConstraints.sort(byDateDesc);
    energizations.sort(byDateDesc);
    lifeSafety.sort(byDateDesc);
    feed.sort(byDateDesc);
    upcoming.sort((a, b) => a.date - b.date);

    return {
      openConstraints,
      energizations,
      upcoming,
      lifeSafety,
      feed: feed.slice(0, 12),
    };
  }, [records]);

  const readyForStartup = MOCK_ASSETS.filter((a) => a.status === "ready");
  const waitingAssets = MOCK_ASSETS.filter((a) => a.status === "waiting" || a.status === "blocked");
  const fgAssets = MOCK_ASSETS.map((a) => {
    const m = a.facilityGridStatus.match(/(\d+)\s*\/\s*(\d+)/);
    const done = m ? Number(m[1]) : 0;
    const total = m ? Number(m[2]) : 1;
    return { asset: a, pct: Math.round((done / Math.max(total, 1)) * 100) };
  }).sort((a, b) => a.pct - b.pct);
  const fgAvg =
    fgAssets.length > 0 ? Math.round(fgAssets.reduce((sum, x) => sum + x.pct, 0) / fgAssets.length) : 0;

  function submitSearch() {
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-1 text-xs uppercase tracking-widest text-ink-dim">{today} · Wing 2</div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">What should I work on today?</h1>
      <p className="mt-1 text-sm text-ink-dim">
        {recordCount === 0
          ? "Mock data only — click Connect data in the top bar to load live project records."
          : `${recordCount.toLocaleString()} live records connected.`}
      </p>

      {/* Universal Search */}
      <GlassPanel glow="cyan" className="mt-6 flex items-center gap-3 px-5 py-4">
        <Search className="h-4 w-4 shrink-0 text-cyan" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitSearch();
          }}
          placeholder="Search an asset, panel, circuit, room, or area — e.g. FSD-13, KSPA1W2, 17, B600"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-dim2 focus:outline-none"
        />
      </GlassPanel>

      {/* Six tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Today's Work */}
        <GlassPanel className="p-4">
          <TileHeading icon={Hammer} label="Today's Work" accent="text-cyan" count={readyForStartup.length + waitingAssets.length} />
          <div className="space-y-1.5">
            {readyForStartup.slice(0, 2).map((a) => (
              <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center justify-between gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5 transition-colors hover:border-cyan/40">
                <span className="truncate text-xs text-ink">{a.name} · ready</span>
                <StatusPill status={a.status} />
              </Link>
            ))}
            {waitingAssets.slice(0, 2).map((a) => (
              <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center justify-between gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5 transition-colors hover:border-cyan/40">
                <span className="truncate text-xs text-ink">{a.name} · {a.inspectionStatus.split("—").find((s) => s.length > 0)?.trim() ?? a.inspectionStatus}</span>
                <StatusPill status={a.status} />
              </Link>
            ))}
          </div>
        </GlassPanel>

        {/* Constraints */}
        <GlassPanel glow={model.openConstraints.length > 0 ? "red" : "none"} className="p-4">
          <TileHeading icon={AlertTriangle} label="Constraints" accent="text-red" count={model.openConstraints.length} />
          {model.openConstraints.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-emerald">No open constraints in connected data.</p>
          ) : (
            <div className="space-y-1.5">
              {model.openConstraints.slice(0, 4).map((item, i) => (
                <div key={`${item.record.sourceRecordId}-${i}`} className="rounded-md border border-glass-border bg-glass px-3 py-1.5">
                  <div className="truncate text-xs text-ink">{item.record.primaryLabel}</div>
                  <div className="mt-0.5 flex justify-between text-[10px] text-ink-dim2">
                    <span className="truncate">{item.record.trade ?? item.record.area ?? ""}</span>
                    {item.date > 0 && <span className="font-mono">{formatDate(item.date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Upcoming */}
        <GlassPanel className="p-4">
          <TileHeading icon={CalendarClock} label="Upcoming · 3 weeks" accent="text-gold" count={model.upcoming.length} />
          {model.upcoming.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-ink-dim">Nothing scheduled in the next 21 days.</p>
          ) : (
            <div className="space-y-1.5">
              {model.upcoming.slice(0, 4).map((item, i) => (
                <div key={`${item.record.sourceRecordId}-${i}`} className="flex items-baseline justify-between gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{item.record.primaryLabel}</span>
                  <span className="shrink-0 font-mono text-[10px] text-gold">{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Recently Energized */}
        <GlassPanel glow={model.energizations.length > 0 ? "emerald" : "none"} className="p-4">
          <TileHeading icon={Zap} label="Recently Energized" accent="text-emerald" count={model.energizations.length} />
          {model.energizations.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-ink-dim">No energization messages in connected data.</p>
          ) : (
            <div className="space-y-1.5">
              {model.energizations.slice(0, 4).map((item, i) => (
                <div key={`${item.record.sourceRecordId}-${i}`} className="flex items-baseline gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald animate-pulse" />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{item.record.primaryLabel}</span>
                  {item.date > 0 && <span className="shrink-0 font-mono text-[10px] text-ink-dim2">{formatDate(item.date)}</span>}
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Life Safety */}
        <GlassPanel className="p-4">
          <TileHeading icon={Flame} label="Life Safety" accent="text-red" count={model.lifeSafety.length} />
          {model.lifeSafety.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-ink-dim">No FSD / FACU / FA activity in connected data.</p>
          ) : (
            <div className="space-y-1.5">
              {model.lifeSafety.slice(0, 4).map((item, i) => (
                <div key={`${item.record.sourceRecordId}-${i}`} className="flex items-baseline justify-between gap-2 rounded-md border border-glass-border bg-glass px-3 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{item.record.primaryLabel}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-dim2">{item.record.source.split(" ").find((w) => w.length > 0) ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* FG Status */}
        <GlassPanel className="p-4">
          <TileHeading icon={ClipboardCheck} label="Facility Grid" accent="text-purple" count={fgAvg} />
          <div className="mb-3">
            <ProgressBar value={fgAvg} accent="purple" />
            <div className="mt-1 text-[10px] text-ink-dim">Wing 2 average checklist completion · {fgAvg}%</div>
          </div>
          <div className="space-y-1.5">
            {fgAssets.slice(0, 3).map(({ asset, pct }) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="block rounded-md border border-glass-border bg-glass px-3 py-1.5 transition-colors hover:border-purple/40">
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink">{asset.name}</span>
                  <span className={pct < 60 ? "text-gold" : "text-ink-dim"}>{pct}%</span>
                </div>
                <ProgressBar value={pct} accent={pct < 60 ? "gold" : "purple"} className="mt-1" />
              </Link>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Live Activity Feed */}
      <GlassPanel className="mt-4 p-4">
        <TileHeading icon={Activity} label="Live Asset Activity" accent="text-cyan" count={model.feed.length} />
        {model.feed.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-ink-dim">
            Connect data to stream the latest field activity across all seven sources.
          </p>
        ) : (
          <div>
            {model.feed.map((item, i) => (
              <FeedRow key={`${item.record.sourceRecordId}-${i}`} item={item} />
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
