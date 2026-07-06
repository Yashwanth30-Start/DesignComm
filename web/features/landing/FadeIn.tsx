"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export function FadeIn({
  children,
  delay = 0,
  duration = 1000,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn("transition-opacity", visible ? "opacity-100" : "opacity-0", className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
