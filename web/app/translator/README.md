# Raaga Live — Telugu → English song translator (`/translator`)

Open the deployed site at **`/translator`** on your phone, tap the mic, and
play a Telugu song near the phone. The app:

1. Listens through the microphone (browser SpeechRecognition, `te-IN`).
2. Shows each recognized lyric line in Telugu script, with a romanized
   reading and an instant English translation (Google gtx endpoint, with a
   MyMemory fallback). A blue "live" card translates the current phrase
   while it is still being sung.
3. Drives the neon blue→pink waveform visualizer from the real audio signal
   (WebAudio AnalyserNode).
4. Keeps the last ~120 lines in `localStorage` so a session survives a
   refresh; `clear` wipes it.

## Requirements & notes

- **HTTPS is required** for microphone access — use the deployed URL (or
  `localhost` in dev), not a plain-HTTP LAN address.
- Live speech recognition works in **Chrome / Edge / Samsung Internet on
  Android** and Safari 14.5+ on iOS. Browsers without it fall back to the
  "paste lyrics" box, which translates typed/pasted Telugu line by line.
- Speech recognizers are tuned for speech, not singing: fast songs with
  heavy instrumentation transcribe imperfectly. Clear vocal passages
  (melodies, slower film songs) work best; keep the phone near the speaker.
- On Android, Chrome restarts recognition sessions every few seconds — the
  app re-arms automatically, so brief gaps between lines are normal.
