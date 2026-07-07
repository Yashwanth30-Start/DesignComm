import { idbDelete, idbGet, idbSet } from "../db/idb";

/**
 * Voice-note capture via MediaRecorder. Audio blobs are stored in the
 * IndexedDB "audio" store keyed by recording id; the SQLite `recordings`
 * table holds the metadata. Everything stays on-device, same as the rest
 * of the workspace.
 */

export function supportsRecording(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** Best supported container: webm/opus on Chromium, mp4 on Safari. */
export function preferredMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export interface ActiveRecording {
  stop: () => Promise<{ blob: Blob; mime: string }>;
  cancel: () => void;
}

export async function startRecording(): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = preferredMimeType();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(1000); // gather data every second so nothing is lost

  const releaseMic = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          releaseMic();
          const type = recorder.mimeType || mime || "audio/webm";
          resolve({ blob: new Blob(chunks, { type }), mime: type });
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // already stopped
      }
      releaseMic();
    }
  };
}

export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  await idbSet("audio", id, blob);
}

export async function loadAudioBlob(id: string): Promise<Blob | undefined> {
  return idbGet<Blob>("audio", id);
}

export async function deleteAudioBlob(id: string): Promise<void> {
  await idbDelete("audio", id);
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
