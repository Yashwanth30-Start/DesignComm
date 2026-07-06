"use client";

import {
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  MessageSquare,
  Clock,
  Link2,
  Building2,
} from "lucide-react";

import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { GlassPanel, SectionHeading, StatusPill, Tag, Timeline, Divider } from "@/components/ui";
import type { Asset } from "@/types/domain";

export function AssetDetailView({ asset }: { asset: Asset }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-ink-dim">
              <Building2 className="h-3.5 w-3.5" />
              {asset.area} · {asset.room}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">{asset.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>Panel {asset.panel}</Tag>
              <Tag>Circuit {asset.circuit}</Tag>
              <Tag>{asset.trade}</Tag>
            </div>
          </div>
          <StatusPill status={asset.status} pulse={asset.status === "blocked"} className="text-sm" />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <GlassPanel className="mt-10 overflow-x-auto p-6">
          <Timeline stages={asset.timeline} orientation="horizontal" className="min-w-[720px]" />
        </GlassPanel>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GlassPanel className="p-5">
            <div className="text-xs uppercase tracking-widest text-ink-dim">Inspection Status</div>
            <div className="mt-2 text-sm text-ink">{asset.inspectionStatus}</div>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="text-xs uppercase tracking-widest text-ink-dim">Facility Grid Status</div>
            <div className="mt-2 text-sm text-ink">{asset.facilityGridStatus}</div>
          </GlassPanel>
        </div>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <SectionHeading
              eyebrow="Open Items"
              title="Constraints"
              description={asset.constraints.length === 0 ? "No open constraints." : undefined}
            />
            <StaggerGroup className="mt-5 space-y-3">
              {asset.constraints.map((constraint) => (
                <StaggerItem key={constraint.id}>
                  <GlassPanel glow={constraint.status === "open" ? "red" : "none"} className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          constraint.status === "open" ? "text-red" : "text-ink-dim"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-ink">{constraint.label}</div>
                        <div className="mt-1 text-xs text-ink-dim">{constraint.note}</div>
                        <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-wider text-ink-dim">
                          <span>Raised {constraint.raisedOn}</span>
                          <span>·</span>
                          <span>{constraint.severity} severity</span>
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          <Divider />

          <section>
            <SectionHeading eyebrow="Field Context" title="Comments" />
            <StaggerGroup className="mt-5 space-y-3">
              {asset.comments.map((comment) => (
                <StaggerItem key={comment.id}>
                  <GlassPanel className="p-4">
                    <div className="flex items-center gap-2 text-xs text-ink-dim">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="font-medium text-ink">{comment.author}</span>
                      <span>· {comment.source}</span>
                      <span className="ml-auto">{comment.postedOn}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink">{comment.body}</p>
                  </GlassPanel>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          <Divider />

          <section>
            <SectionHeading eyebrow="Full Audit Trail" title="History" />
            <div className="mt-5 space-y-4 border-l border-glass-border-hi pl-5">
              {asset.history.map((entry) => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-cyan" />
                  <div className="flex items-center gap-2 text-xs text-ink-dim">
                    <Clock className="h-3 w-3" />
                    {entry.occurredOn}
                  </div>
                  <div className="text-sm font-medium text-ink">{entry.label}</div>
                  <div className="text-xs text-ink-dim">{entry.detail}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <SectionHeading eyebrow="Records" title="Documents" />
            <div className="mt-5 space-y-2">
              {asset.documents.map((doc) => (
                <GlassPanel key={doc.id} className="flex items-center gap-3 p-3">
                  <FileText className="h-4 w-4 shrink-0 text-cyan" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-ink">{doc.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-dim">
                      {doc.source} · {doc.updatedOn}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading eyebrow="Field Evidence" title="Photos" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              {asset.photos.map((photo) => (
                <GlassPanel
                  key={photo.id}
                  className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center"
                >
                  <ImageIcon className="h-5 w-5 text-ink-dim" />
                  <span className="text-[10px] text-ink-dim">{photo.caption}</span>
                </GlassPanel>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading eyebrow="Connected" title="Related Assets" />
            <div className="mt-5 space-y-2">
              {asset.relatedAssets.map((related) => (
                <GlassPanel key={related.id} hoverLift className="flex items-center gap-3 p-3">
                  <Link2 className="h-4 w-4 shrink-0 text-purple" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-ink">{related.name}</div>
                    <div className="text-[10px] text-ink-dim">{related.relationship}</div>
                  </div>
                  <StatusPill status={related.status} />
                </GlassPanel>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
