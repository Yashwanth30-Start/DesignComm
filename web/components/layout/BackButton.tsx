"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCw } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.back()}
        title="Back"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-glass hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
      <button
        onClick={() => router.refresh()}
        title="Refresh"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-glass hover:text-ink"
      >
        <RotateCw className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
