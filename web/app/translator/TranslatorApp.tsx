"use client";

/**
 * Raaga Live — real-time Telugu → English song translator.
 *
 * Pipeline: microphone → SpeechRecognition (te-IN, continuous) → lyric lines
 * → translation API (Google gtx endpoint, MyMemory fallback) → live feed.
 * The same microphone feeds a WebAudio AnalyserNode that drives the neon
 * waveform visualizer.
 *
 * Speech recognition needs Chrome / Edge / Samsung Internet (Android) or
 * Safari 14.5+ (iOS), served over HTTPS. A paste-lyrics fallback keeps the
 * page useful everywhere else.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------------------------- types --------------------------------- */

type LyricLine = {
  id: string;
  te: string;
  roman?: string;
  en?: string;
  ts: number;
  pending: boolean;
  failed?: boolean;
};

type Status = "idle" | "starting" | "listening" | "denied" | "unsupported";

type TranslationResult = { en: string; roman?: string };

/* ------------------------------- translation ------------------------------ */

const cache = new Map<string, TranslationResult>();

async function translateTelugu(text: string, signal?: AbortSignal): Promise<TranslationResult> {
  const key = text.trim();
  const hit = cache.get(key);
  if (hit) return hit;

  // Primary: Google's public gtx endpoint (CORS-enabled, no key).
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=te&tl=en&dt=t&dt=rm&dj=1&q=" +
      encodeURIComponent(key);
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      const sentences: Array<{ trans?: string; src_translit?: string }> = data?.sentences ?? [];
      const en = sentences
        .map((s) => s.trans ?? "")
        .join("")
        .trim();
      const roman = sentences
        .map((s) => s.src_translit ?? "")
        .join(" ")
        .trim();
      if (en) {
        const out = { en, roman: roman || undefined };
        cache.set(key, out);
        return out;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
  }

  // Fallback: MyMemory (free, rate-limited).
  const res = await fetch(
    "https://api.mymemory.translated.net/get?langpair=te%7Cen&q=" + encodeURIComponent(key),
    { signal }
  );
  if (!res.ok) throw new Error("translation failed");
  const data = await res.json();
  const en = (data?.responseData?.translatedText ?? "").trim();
  if (!en) throw new Error("translation empty");
  const out = { en };
  cache.set(key, out);
  return out;
}

/* --------------------------------- helpers -------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);

const HISTORY_KEY = "raaga-live-history-v1";

function loadHistory(): LyricLine[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LyricLine[];
    return Array.isArray(parsed) ? parsed.slice(-120) : [];
  } catch {
    return [];
  }
}

function saveHistory(lines: LyricLine[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(lines.slice(-120)));
  } catch {
    /* storage full / private mode — history is a nicety */
  }
}

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------- visualizer ------------------------------- */
/**
 * Neon "harmonic strings" visualizer: many thin horizontal lines share a set
 * of gaussian bumps whose heights ride the live audio bands, splaying apart
 * where the energy is — the woven blue→pink ridge look. Drawn with additive
 * blending on near-black.
 */
function startVisualizer(
  canvas: HTMLCanvasElement,
  getBands: () => Float32Array // 5 smoothed band energies, 0..1
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let raf = 0;
  let running = true;
  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Star-dust particles.
  const P = 42;
  const px = new Float32Array(P);
  const py = new Float32Array(P);
  const pv = new Float32Array(P);
  const ps = new Float32Array(P);
  for (let i = 0; i < P; i++) {
    px[i] = Math.random();
    py[i] = Math.random();
    pv[i] = 0.008 + Math.random() * 0.03;
    ps[i] = 0.6 + Math.random() * 1.6;
  }

  // Gaussian bump centers along x (0..1), one per audio band.
  const BUMPS = 5;
  const centers = [0.12, 0.32, 0.5, 0.68, 0.88];
  const widths = [0.07, 0.09, 0.08, 0.09, 0.07];
  const smooth = new Float32Array(BUMPS);

  const LINES = 18;

  const draw = (t: number) => {
    if (!running) return;
    const time = t / 1000;
    const bands = getBands();

    for (let b = 0; b < BUMPS; b++) {
      const target = bands[b] ?? 0;
      const current = smooth[b] ?? 0;
      smooth[b] = current + (target - current) * (target > current ? 0.28 : 0.06);
    }

    ctx.clearRect(0, 0, w, h);

    // Faint ambient glows.
    ctx.globalCompositeOperation = "source-over";
    const glowL = ctx.createRadialGradient(w * 0.18, h * 0.5, 0, w * 0.18, h * 0.5, w * 0.45);
    glowL.addColorStop(0, "rgba(64,160,255,0.045)");
    glowL.addColorStop(1, "rgba(64,160,255,0)");
    ctx.fillStyle = glowL;
    ctx.fillRect(0, 0, w, h);
    const glowR = ctx.createRadialGradient(w * 0.84, h * 0.5, 0, w * 0.84, h * 0.5, w * 0.45);
    glowR.addColorStop(0, "rgba(255,60,120,0.05)");
    glowR.addColorStop(1, "rgba(255,60,120,0)");
    ctx.fillStyle = glowR;
    ctx.fillRect(0, 0, w, h);

    // Particles.
    for (let i = 0; i < P; i++) {
      let y = (py[i] ?? 0) - (pv[i] ?? 0) / 100;
      if (y < -0.02) {
        y = 1.02;
        px[i] = Math.random();
      }
      py[i] = y;
      const x = px[i] ?? 0;
      ctx.fillStyle = x > 0.55 ? "rgba(255,90,140,0.5)" : "rgba(110,190,255,0.5)";
      ctx.beginPath();
      ctx.arc(x * w, y * h, (ps[i] ?? 1) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Waveform strings.
    ctx.globalCompositeOperation = "lighter";
    const mid = h * 0.52;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(70,170,255,1)");
    grad.addColorStop(0.45, "rgba(140,160,255,1)");
    grad.addColorStop(0.62, "rgba(240,110,190,1)");
    grad.addColorStop(1, "rgba(255,60,110,1)");

    const idle = 0.11 + 0.05 * Math.sin(time * 1.3) * Math.sin(time * 0.53 + 1.7);
    const amp = h * 0.36;
    const STEPS = 90;

    const bumpAt = (x01: number) => {
      let v = 0;
      for (let b = 0; b < BUMPS; b++) {
        const d = (x01 - (centers[b] ?? 0.5)) / (widths[b] ?? 0.08);
        const wob = 1 + 0.22 * Math.sin(time * (1.1 + b * 0.37) + b * 2.1);
        v += (idle + (smooth[b] ?? 0)) * wob * Math.exp(-d * d);
      }
      // Fade to flat at both edges, like the reference frames.
      const edge = Math.min(1, Math.min(x01, 1 - x01) * 14);
      return v * edge;
    };

    for (let li = 0; li < LINES; li++) {
      const k = li / (LINES - 1); // 0..1
      const spread = (k - 0.5) * 2; // -1..1 — how far this string splays
      const alpha = 0.05 + 0.16 * (1 - Math.abs(spread));
      ctx.strokeStyle = grad;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.abs(spread) < 0.12 ? 1.6 : 1;
      ctx.beginPath();
      for (let s = 0; s <= STEPS; s++) {
        const x01 = s / STEPS;
        const envelope = bumpAt(x01);
        const carrier = Math.sin(x01 * Math.PI * 6 + time * 2.2);
        const y = mid - envelope * amp * carrier * (0.35 + 0.65 * Math.abs(spread)) - envelope * amp * 0.12 * spread;
        const x = x01 * w;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Bright core line.
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(160,140,255,0.8)";
    ctx.strokeStyle = grad;
    ctx.beginPath();
    for (let s = 0; s <= STEPS; s++) {
      const x01 = s / STEPS;
      const envelope = bumpAt(x01);
      const y = mid - envelope * amp * Math.sin(x01 * Math.PI * 6 + time * 2.2) * 0.4;
      const x = x01 * w;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}

/* ----------------------------------- app ---------------------------------- */

export function TranslatorApp() {
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [interim, setInterim] = useState("");
  const [interimEn, setInterimEn] = useState("");
  const [manualText, setManualText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bandsRef = useRef<Float32Array>(new Float32Array(5));
  const interimAbortRef = useRef<AbortController | null>(null);
  const interimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------- history persistence ------- */
  useEffect(() => {
    setLines(loadHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(lines);
  }, [lines, hydrated]);

  /* ------- visualizer ------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startVisualizer(canvas, () => bandsRef.current);
  }, []);

  /* ------- auto-scroll feed ------- */
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, interim]);

  /* ------- translate one finalized line ------- */
  const translateLine = useCallback((id: string, te: string) => {
    translateTelugu(te)
      .then(({ en, roman }) =>
        setLines((prev) =>
          prev.map((l) => (l.id === id ? { ...l, en, roman, pending: false } : l))
        )
      )
      .catch(() =>
        setLines((prev) =>
          prev.map((l) => (l.id === id ? { ...l, pending: false, failed: true } : l))
        )
      );
  }, []);

  const pushLine = useCallback(
    (te: string) => {
      const text = te.trim();
      if (!text) return;
      const id = uid();
      setLines((prev) => [...prev, { id, te: text, ts: Date.now(), pending: true }]);
      translateLine(id, text);
    },
    [translateLine]
  );

  const retryLine = useCallback(
    (line: LyricLine) => {
      setLines((prev) =>
        prev.map((l) => (l.id === line.id ? { ...l, pending: true, failed: false } : l))
      );
      translateLine(line.id, line.te);
    },
    [translateLine]
  );

  /* ------- live translation of the interim phrase (debounced) ------- */
  const scheduleInterimTranslation = useCallback((text: string) => {
    if (interimTimerRef.current) clearTimeout(interimTimerRef.current);
    if (!text.trim()) {
      setInterimEn("");
      return;
    }
    interimTimerRef.current = setTimeout(() => {
      interimAbortRef.current?.abort();
      const ac = new AbortController();
      interimAbortRef.current = ac;
      translateTelugu(text, ac.signal)
        .then(({ en }) => {
          if (!ac.signal.aborted) setInterimEn(en);
        })
        .catch(() => {});
    }, 500);
  }, []);

  /* ------- audio analyser for the visualizer ------- */
  const attachAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      streamRef.current = stream;
      const AC: typeof AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const actx = new AC();
      audioCtxRef.current = actx;
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!audioCtxRef.current) return;
        analyser.getByteFrequencyData(data);
        // Five log-ish bands across the useful vocal/music range.
        const edges = [2, 8, 20, 44, 90, 180];
        for (let b = 0; b < 5; b++) {
          const lo = edges[b] ?? 0;
          const hi = edges[b + 1] ?? lo + 1;
          let sum = 0;
          for (let i = lo; i < hi; i++) sum += data[i] ?? 0;
          const avg = sum / (hi - lo) / 255;
          bandsRef.current[b] = Math.min(1, avg * 1.6);
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* visualizer falls back to its idle animation */
    }
  }, []);

  const detachAnalyser = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    bandsRef.current = new Float32Array(5);
  }, []);

  /* ------- speech recognition ------- */
  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    detachAnalyser();
    setInterim("");
    setInterimEn("");
    setStatus("idle");
  }, [detachAnalyser]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStatus("unsupported");
      setShowManual(true);
      return;
    }
    setStatus("starting");
    wantListeningRef.current = true;

    const spinUp = () => {
      if (!wantListeningRef.current) return;
      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = "te-IN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => setStatus("listening");

      rec.onresult = (event: any) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript: string = result[0]?.transcript ?? "";
          if (result.isFinal) {
            pushLine(transcript);
          } else {
            interimText += transcript;
          }
        }
        setInterim(interimText);
        scheduleInterimTranslation(interimText);
      };

      rec.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          wantListeningRef.current = false;
          setStatus("denied");
        }
        // "no-speech" / "aborted" / "network" fall through to onend → restart.
      };

      // Mobile Chrome ends sessions constantly; keep re-arming while active.
      rec.onend = () => {
        if (wantListeningRef.current) setTimeout(spinUp, 250);
      };

      try {
        rec.start();
      } catch {
        /* already started — ignore */
      }
    };

    spinUp();
    attachAnalyser();
  }, [attachAnalyser, pushLine, scheduleInterimTranslation]);

  useEffect(() => () => stopListening(), [stopListening]);

  const toggleListening = () => {
    if (status === "listening" || status === "starting") stopListening();
    else startListening();
  };

  /* ------- manual paste/type fallback ------- */
  const submitManual = () => {
    const text = manualText.trim();
    if (!text) return;
    text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach(pushLine);
    setManualText("");
  };

  const clearAll = () => {
    setLines([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const live = status === "listening" || status === "starting";

  /* ---------------------------------- ui ---------------------------------- */

  return (
    <main
      className="fixed inset-0 z-50 flex flex-col overflow-hidden text-ink"
      style={{
        background:
          "radial-gradient(120% 60% at 50% -10%, #0a1020 0%, #04060b 55%, #030408 100%)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* corner HUD, like the reference frames */}
      <div className="pointer-events-none absolute left-4 top-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink-dim/60">
        te-IN · asr.live
      </div>
      <div className="pointer-events-none absolute right-4 top-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink-dim/60">
        v1.0 · te → en
      </div>

      {/* header */}
      <header className="flex items-center justify-between px-5 pb-1 pt-8">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[#5ac8ff] via-[#a58bff] to-[#ff4d8d] bg-clip-text text-transparent">
              Raaga Live
            </span>
          </h1>
          <p className="text-[11px] text-ink-dim">Telugu songs → English, as you listen</p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest ${
            live
              ? "border-[#ff4d8d]/40 bg-[#ff4d8d]/10 text-[#ff8ab0]"
              : "border-glass-border bg-glass text-ink-dim"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "animate-pulse bg-[#ff4d8d]" : "bg-ink-dim/50"
            }`}
          />
          {status === "listening"
            ? "listening"
            : status === "starting"
            ? "starting"
            : status === "denied"
            ? "mic blocked"
            : status === "unsupported"
            ? "no asr"
            : "paused"}
        </div>
      </header>

      {/* visualizer */}
      <div className="relative h-[30vh] min-h-[160px] shrink-0">
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* mic button overlapping the wave */}
        <div className="absolute inset-x-0 -bottom-7 flex justify-center">
          <button
            onClick={toggleListening}
            aria-label={live ? "Stop listening" : "Start listening"}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95"
          >
            {live && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-[#ff4d8d]/20" />
                <span className="absolute -inset-2 rounded-full border border-[#ff4d8d]/20" />
              </>
            )}
            <span
              className={`absolute inset-0 rounded-full transition-shadow ${
                live
                  ? "bg-gradient-to-br from-[#ff4d8d] to-[#b23cff] shadow-[0_0_36px_rgba(255,77,141,0.55)]"
                  : "bg-gradient-to-br from-[#3fa9ff] to-[#7a5cff] shadow-[0_0_28px_rgba(80,150,255,0.45)]"
              }`}
            />
            {live ? (
              <svg viewBox="0 0 24 24" className="relative h-5 w-5 fill-white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="relative h-6 w-6 fill-white">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                <path d="M18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V21h2v-2.06A8 8 0 0 0 20 11h-2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* status hints */}
      <div className="mt-9 px-5 text-center">
        {status === "idle" && lines.length === 0 && (
          <p className="text-xs text-ink-dim">
            Play a Telugu song near your phone, then tap the mic. Lyrics appear below with live
            English translation.
          </p>
        )}
        {status === "denied" && (
          <p className="text-xs text-red">
            Microphone access is blocked — allow the mic for this site in your browser settings,
            then try again.
          </p>
        )}
        {status === "unsupported" && (
          <p className="text-xs text-amber">
            This browser has no live speech recognition (try Chrome on Android). You can still
            paste Telugu lyrics below to translate them.
          </p>
        )}
      </div>

      {/* lyric feed */}
      <div ref={feedRef} className="mt-2 flex-1 space-y-3 overflow-y-auto px-4 pb-40 pt-2">
        {lines.map((line) => (
          <article
            key={line.id}
            className="liquid-glass rounded-lg px-4 py-3"
            style={{ background: "rgba(10,14,24,0.55)" }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-[15px] leading-relaxed text-ink"
                style={{ fontFamily: "var(--font-telugu), var(--font-sans)" }}
              >
                {line.te}
              </p>
              <span className="shrink-0 font-mono text-[9px] text-ink-dim/60">
                {timeLabel(line.ts)}
              </span>
            </div>
            {line.roman && (
              <p className="mt-0.5 text-[11px] italic tracking-wide text-ink-dim">{line.roman}</p>
            )}
            {line.pending ? (
              <p className="mt-1.5 animate-pulse text-[13px] text-[#7fb8ff]/70">translating…</p>
            ) : line.failed ? (
              <button
                onClick={() => retryLine(line)}
                className="mt-1.5 text-[12px] text-amber underline underline-offset-2"
              >
                translation failed — tap to retry
              </button>
            ) : (
              <p className="mt-1.5 border-l-2 border-[#ff4d8d]/50 pl-2.5 text-[13px] leading-relaxed text-[#ffd4e3]">
                {line.en}
              </p>
            )}
          </article>
        ))}

        {/* live interim line */}
        {interim && (
          <article className="rounded-lg border border-[#5ac8ff]/25 bg-[#5ac8ff]/[0.06] px-4 py-3">
            <p
              className="text-[15px] leading-relaxed text-[#bfe4ff]"
              style={{ fontFamily: "var(--font-telugu), var(--font-sans)" }}
            >
              {interim}
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#5ac8ff] align-middle" />
            </p>
            {interimEn && (
              <p className="mt-1.5 text-[13px] italic leading-relaxed text-[#8fd0ff]/80">
                {interimEn}
              </p>
            )}
          </article>
        )}

        {lines.length === 0 && !interim && (
          <div className="flex flex-col items-center gap-1 pt-8 text-center opacity-60">
            <p
              className="text-xl text-ink-dim"
              style={{ fontFamily: "var(--font-telugu), var(--font-sans)" }}
            >
              పాట వినిపించండి…
            </p>
            <p className="text-xs text-ink-dim">play a song for me…</p>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <footer className="absolute inset-x-0 bottom-0 z-10 space-y-2 px-4 pb-5 pt-3"
        style={{ background: "linear-gradient(0deg, rgba(3,4,8,0.96) 55%, rgba(3,4,8,0))" }}
      >
        {showManual && (
          <div className="liquid-glass flex items-end gap-2 rounded-lg p-2" style={{ background: "rgba(10,14,24,0.7)" }}>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={2}
              placeholder="పాట సాహిత్యం పేస్ట్ చేయండి… (paste Telugu lyrics)"
              className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-dim/50 focus:outline-none"
              style={{ fontFamily: "var(--font-telugu), var(--font-sans)" }}
            />
            <button
              onClick={submitManual}
              className="rounded-md bg-gradient-to-br from-[#3fa9ff] to-[#7a5cff] px-4 py-2 text-xs font-semibold text-white shadow-glow-cyan"
            >
              Translate
            </button>
          </div>
        )}
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-dim/70">
          <button
            onClick={() => setShowManual((v) => !v)}
            className="rounded-full border border-glass-border px-3 py-1.5 transition-colors hover:text-ink"
          >
            {showManual ? "hide paste box" : "paste lyrics"}
          </button>
          <span>{lines.length} lines</span>
          <button
            onClick={clearAll}
            disabled={lines.length === 0}
            className="rounded-full border border-glass-border px-3 py-1.5 transition-colors hover:text-red disabled:opacity-40"
          >
            clear
          </button>
        </div>
      </footer>
    </main>
  );
}
