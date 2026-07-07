import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { useData } from "../../state/DataProvider";
import { recordings } from "../../db/repo";
import { Button, SectionHeading } from "../../components/ui/primitives";
import {
  deleteAudioBlob,
  formatDuration,
  loadAudioBlob,
  saveAudioBlob,
  startRecording,
  supportsRecording,
  type ActiveRecording
} from "../../lib/audio";
import { newId } from "../../lib/id";
import { relativeTime } from "../../lib/dates";
import { cn } from "../../lib/cn";
import type { Recording } from "../../types";

/**
 * Record-and-play voice notes attached to any entity (meeting, journal day,
 * note). Drop it into a panel: <VoiceNotes entityType="meeting" entityId={id} />
 */
export function VoiceNotes({
  entityType,
  entityId,
  defaultTitle
}: {
  entityType: Recording["entityType"];
  entityId: string;
  defaultTitle: string;
}) {
  const { db, version, mutate } = useData();
  const [active, setActive] = useState<ActiveRecording | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const list = useMemo(
    () => recordings.forEntity(db, entityType, entityId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version, entityType, entityId]
  );

  // Clean up mic + playback if the panel unmounts mid-action.
  useEffect(() => {
    return () => {
      active?.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supportsRecording()) {
    return (
      <p className="text-xs text-ink-dim2">
        Voice notes need microphone access (MediaRecorder), which this browser doesn't
        provide. Recordings made on another device still play here.
      </p>
    );
  }

  const begin = async () => {
    setError(null);
    try {
      const rec = await startRecording();
      setActive(rec);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access was denied — allow it in the browser's site settings."
          : e instanceof Error
            ? e.message
            : String(e)
      );
    }
  };

  const finish = async () => {
    if (!active) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const seconds = elapsed;
    setActive(null);
    const { blob, mime } = await active.stop();
    const id = newId();
    await saveAudioBlob(id, blob);
    mutate((d) =>
      recordings.create(d, {
        id,
        title: `${defaultTitle} — ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        entityType,
        entityId,
        mime,
        durationSeconds: seconds,
        size: blob.size
      })
    );
  };

  const discard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    active?.cancel();
    setActive(null);
  };

  const play = async (rec: Recording) => {
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    const blob = await loadAudioBlob(rec.id);
    if (!blob) {
      setError("Audio data missing for this recording.");
      return;
    }
    audioRef.current?.pause();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      setPlayingId(null);
      URL.revokeObjectURL(url);
    };
    setPlayingId(rec.id);
    await audio.play();
  };

  const remove = async (rec: Recording) => {
    if (!window.confirm("Delete this voice note?")) return;
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    await deleteAudioBlob(rec.id);
    mutate((d) => recordings.remove(d, rec.id));
  };

  return (
    <div>
      <SectionHeading
        title={`Voice notes${list.length ? ` (${list.length})` : ""}`}
        action={
          active ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-red">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red" />
                {formatDuration(elapsed)}
              </span>
              <Button variant="primary" onClick={() => void finish()}>
                <Square size={12} /> Save
              </Button>
              <Button onClick={discard}>Discard</Button>
            </div>
          ) : (
            <Button variant="primary" onClick={() => void begin()}>
              <Mic size={13} /> Record
            </Button>
          )
        }
      />
      {error && <p className="mb-2 text-xs text-red">{error}</p>}
      {list.length === 0 && !active ? (
        <p className="text-xs text-ink-dim2">
          No voice notes yet — hit Record and just talk. Audio stays on this device.
        </p>
      ) : (
        <div className="space-y-1.5">
          {list.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-3 py-2"
            >
              <button
                onClick={() => void play(rec)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  playingId === rec.id
                    ? "border-cyan/50 bg-cyan/15 text-cyan"
                    : "border-white/10 text-ink-dim hover:border-cyan/40 hover:text-cyan"
                )}
                aria-label={playingId === rec.id ? "Pause" : "Play"}
              >
                {playingId === rec.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <input
                  className="w-full truncate bg-transparent text-sm text-ink focus:outline-none"
                  defaultValue={rec.title}
                  onBlur={(e) => {
                    const t = e.target.value.trim();
                    if (t && t !== rec.title) mutate((d) => recordings.rename(d, rec.id, t));
                  }}
                />
                <p className="text-[11px] text-ink-dim2">
                  {formatDuration(rec.durationSeconds)} · {relativeTime(rec.createdAt)}
                </p>
              </div>
              <button
                onClick={() => void remove(rec)}
                className="shrink-0 text-ink-dim2 hover:text-red"
                aria-label="Delete voice note"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
