import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** Renders trusted-ish local Markdown (sanitized) with the app's typography. */
export function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className="prose-eos max-w-none text-sm leading-relaxed text-ink"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
