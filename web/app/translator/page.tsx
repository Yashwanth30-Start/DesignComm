import type { Metadata } from "next";
import { Noto_Sans_Telugu } from "next/font/google";
import { TranslatorApp } from "./TranslatorApp";

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "700"],
  variable: "--font-telugu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raaga Live — Telugu → English Song Translator",
  description:
    "Point your phone at any Telugu song. Raaga Live listens, transcribes the lyrics and translates them to English in real time — with a live audio-reactive visualizer.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Raaga Live",
  },
};

export default function TranslatorPage() {
  return (
    <div className={notoTelugu.variable}>
      <TranslatorApp />
    </div>
  );
}
