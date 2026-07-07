import type { Database } from "sql.js";
import { rows } from "../db/database";
import type { SearchResult, SearchResultType } from "../types";

/**
 * Global search across every entity type. Case-insensitive substring match
 * (SQLite LIKE); each source contributes typed results with a route so any
 * hit is one click away.
 */

function like(q: string): string {
  return `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
}

function snippet(text: string, q: string, max = 140): string {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, max);
  const start = Math.max(0, idx - 40);
  const chunk = text.slice(start, start + max);
  return (start > 0 ? "…" : "") + chunk + (start + max < text.length ? "…" : "");
}

interface Source {
  type: SearchResultType;
  sql: string;
  route: (id: string) => string;
  title: (r: Record<string, unknown>) => string;
  body: (r: Record<string, unknown>) => string;
  date?: (r: Record<string, unknown>) => string;
}

const SOURCES: Source[] = [
  {
    type: "task",
    sql: `SELECT id, title, description || ' ' || notes || ' ' || category AS body, due_date AS d
          FROM tasks WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: () => "/tasks",
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? ""),
    date: (r) => String(r.d ?? "")
  },
  {
    type: "meeting",
    sql: `SELECT id, title, notes || ' ' || summary || ' ' || attendees AS body, date AS d
          FROM meetings WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: (id) => `/meetings/${id}`,
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? ""),
    date: (r) => String(r.d ?? "")
  },
  {
    type: "project",
    sql: `SELECT id, name AS title, description || ' ' || goals AS body FROM projects
          WHERE name LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: (id) => `/projects/${id}`,
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? "")
  },
  {
    type: "idea",
    sql: `SELECT id, title, description || ' ' || tags AS body FROM ideas
          WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: () => "/ideas",
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? "")
  },
  {
    type: "note",
    sql: `SELECT id, title, content || ' ' || tags || ' ' || category AS body FROM notes
          WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: (id) => `/knowledge?note=${id}`,
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? "")
  },
  {
    type: "document",
    sql: `SELECT id, name AS title, path || ' ' || content_text AS body, modified_at AS d
          FROM documents WHERE name LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: () => "/documents",
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? ""),
    date: (r) => String(r.d ?? "")
  },
  {
    type: "learning",
    sql: `SELECT id, name AS title,
            notes || ' ' || exercises || ' ' || weak_areas || ' ' || next_lesson AS body
          FROM learning_topics WHERE name LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'`,
    route: () => "/learning",
    title: (r) => String(r.title),
    body: (r) => String(r.body ?? "")
  },
  {
    type: "journal",
    sql: `SELECT id, date AS title,
            goals || ' ' || completed || ' ' || problems || ' ' || lessons || ' ' || ideas || ' ' || tomorrow AS body,
            date AS d
          FROM journal WHERE body LIKE ? ESCAPE '\\'`,
    route: (id) => `/journal?id=${id}`,
    title: (r) => `Journal — ${String(r.title)}`,
    body: (r) => String(r.body ?? ""),
    date: (r) => String(r.d ?? "")
  }
];

export function globalSearch(db: Database, query: string, limitPerType = 8): SearchResult[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const pattern = like(q);
  const results: SearchResult[] = [];
  for (const src of SOURCES) {
    const paramCount = (src.sql.match(/\?/g) ?? []).length;
    const found = rows(db, `${src.sql} LIMIT ${limitPerType}`, Array(paramCount).fill(pattern));
    for (const r of found) {
      results.push({
        type: src.type,
        id: String(r.id),
        title: src.title(r),
        snippet: snippet(src.body(r), q),
        route: src.route(String(r.id)),
        date: src.date?.(r) || undefined
      });
    }
  }
  return results;
}
