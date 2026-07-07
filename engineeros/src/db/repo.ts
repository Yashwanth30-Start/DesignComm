import type { Database } from "sql.js";
import { rows, run } from "./database";
import { newId, nowIso } from "../lib/id";
import { DEFAULT_SETTINGS } from "./seed";
import type {
  AppSettings,
  Doc,
  Idea,
  JournalEntry,
  LearningTopic,
  Meeting,
  Note,
  Persona,
  Project,
  Recording,
  Task,
  WeeklyReview
} from "../types";

/**
 * Repositories: the only place SQL lives. Pages call these through the
 * DataProvider's `mutate` wrapper, which persists and re-renders after writes.
 * All functions are synchronous — sql.js runs in-memory.
 */

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v));
const n = (v: unknown): number => (v == null ? 0 : Number(v));
const opt = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
const optN = (v: unknown): number | null => (v == null ? null : Number(v));

// ---------------------------------------------------------------- projects

function toProject(r: Row): Project {
  return {
    id: s(r.id),
    name: s(r.name),
    description: s(r.description),
    goals: s(r.goals),
    status: s(r.status) as Project["status"],
    isDefault: n(r.is_default) === 1,
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const projects = {
  all(db: Database): Project[] {
    return rows(db, "SELECT * FROM projects ORDER BY is_default DESC, name").map(toProject);
  },
  get(db: Database, id: string): Project | null {
    const r = rows(db, "SELECT * FROM projects WHERE id=?", [id]);
    return r.length ? toProject(r[0]) : null;
  },
  create(db: Database, data: Pick<Project, "name" | "description" | "goals">): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO projects (id,name,description,goals,status,is_default,created_at,updated_at)
       VALUES (?,?,?,?,'active',0,?,?)`,
      [id, data.name, data.description, data.goals, ts, ts]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<Project>): void {
    const cur = projects.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE projects SET name=?, description=?, goals=?, status=?, updated_at=? WHERE id=?`,
      [next.name, next.description, next.goals, next.status, nowIso(), id]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM projects WHERE id=?", [id]);
    run(db, "UPDATE tasks SET project_id=NULL WHERE project_id=?", [id]);
    run(db, "UPDATE notes SET project_id=NULL WHERE project_id=?", [id]);
    run(db, "UPDATE ideas SET project_id=NULL WHERE project_id=?", [id]);
    run(db, "UPDATE documents SET project_id=NULL WHERE project_id=?", [id]);
    run(db, "UPDATE meetings SET project_id=NULL WHERE project_id=?", [id]);
  }
};

// ------------------------------------------------------------------- tasks

function toTask(r: Row): Task {
  return {
    id: s(r.id),
    title: s(r.title),
    description: s(r.description),
    priority: s(r.priority) as Task["priority"],
    projectId: opt(r.project_id),
    category: s(r.category),
    dueDate: opt(r.due_date),
    estimatedMinutes: optN(r.estimated_minutes),
    actualMinutes: optN(r.actual_minutes),
    status: s(r.status) as Task["status"],
    meetingId: opt(r.meeting_id),
    documentId: opt(r.document_id),
    notes: s(r.notes),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    completedAt: opt(r.completed_at)
  };
}

export type TaskInput = Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">> & {
  title: string;
};

export const tasks = {
  all(db: Database): Task[] {
    return rows(
      db,
      `SELECT * FROM tasks ORDER BY
         CASE status WHEN 'done' THEN 1 ELSE 0 END,
         CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         due_date IS NULL, due_date, created_at DESC`
    ).map(toTask);
  },
  get(db: Database, id: string): Task | null {
    const r = rows(db, "SELECT * FROM tasks WHERE id=?", [id]);
    return r.length ? toTask(r[0]) : null;
  },
  forProject(db: Database, projectId: string): Task[] {
    return tasks.all(db).filter((t) => t.projectId === projectId);
  },
  forMeeting(db: Database, meetingId: string): Task[] {
    return tasks.all(db).filter((t) => t.meetingId === meetingId);
  },
  create(db: Database, data: TaskInput): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO tasks (id,title,description,priority,project_id,category,due_date,
         estimated_minutes,actual_minutes,status,meeting_id,document_id,notes,created_at,updated_at,completed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.title,
        data.description ?? "",
        data.priority ?? "medium",
        data.projectId ?? null,
        data.category ?? "",
        data.dueDate ?? null,
        data.estimatedMinutes ?? null,
        data.actualMinutes ?? null,
        data.status ?? "todo",
        data.meetingId ?? null,
        data.documentId ?? null,
        data.notes ?? "",
        ts,
        ts,
        data.status === "done" ? ts : null
      ]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<Task>): void {
    const cur = tasks.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    const ts = nowIso();
    const completedAt =
      next.status === "done" ? (cur.status === "done" ? cur.completedAt : ts) : null;
    run(
      db,
      `UPDATE tasks SET title=?, description=?, priority=?, project_id=?, category=?, due_date=?,
         estimated_minutes=?, actual_minutes=?, status=?, meeting_id=?, document_id=?, notes=?,
         updated_at=?, completed_at=? WHERE id=?`,
      [
        next.title,
        next.description,
        next.priority,
        next.projectId,
        next.category,
        next.dueDate,
        next.estimatedMinutes,
        next.actualMinutes,
        next.status,
        next.meetingId,
        next.documentId,
        next.notes,
        ts,
        completedAt,
        id
      ]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM tasks WHERE id=?", [id]);
  },
  completedBetween(db: Database, fromIso: string, toIso: string): Task[] {
    return rows(db, "SELECT * FROM tasks WHERE completed_at >= ? AND completed_at < ?", [
      fromIso,
      toIso
    ]).map(toTask);
  }
};

// ---------------------------------------------------------------- meetings

function toMeeting(r: Row): Meeting {
  return {
    id: s(r.id),
    title: s(r.title),
    date: s(r.date),
    time: s(r.time),
    attendees: s(r.attendees),
    notes: s(r.notes),
    summary: s(r.summary),
    projectId: opt(r.project_id),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const meetings = {
  all(db: Database): Meeting[] {
    return rows(db, "SELECT * FROM meetings ORDER BY date DESC, time DESC").map(toMeeting);
  },
  get(db: Database, id: string): Meeting | null {
    const r = rows(db, "SELECT * FROM meetings WHERE id=?", [id]);
    return r.length ? toMeeting(r[0]) : null;
  },
  onDate(db: Database, date: string): Meeting[] {
    return rows(db, "SELECT * FROM meetings WHERE date=? ORDER BY time", [date]).map(toMeeting);
  },
  create(
    db: Database,
    data: Partial<Omit<Meeting, "id" | "createdAt" | "updatedAt">> & { title: string; date: string }
  ): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO meetings (id,title,date,time,attendees,notes,summary,project_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.title,
        data.date,
        data.time ?? "",
        data.attendees ?? "",
        data.notes ?? "",
        data.summary ?? "",
        data.projectId ?? null,
        ts,
        ts
      ]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<Meeting>): void {
    const cur = meetings.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE meetings SET title=?, date=?, time=?, attendees=?, notes=?, summary=?, project_id=?, updated_at=?
       WHERE id=?`,
      [
        next.title,
        next.date,
        next.time,
        next.attendees,
        next.notes,
        next.summary,
        next.projectId,
        nowIso(),
        id
      ]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM meetings WHERE id=?", [id]);
    run(db, "UPDATE tasks SET meeting_id=NULL WHERE meeting_id=?", [id]);
    run(db, "DELETE FROM recordings WHERE entity_type='meeting' AND entity_id=?", [id]);
  }
};

// ------------------------------------------------------------------- notes

function toNote(r: Row): Note {
  return {
    id: s(r.id),
    title: s(r.title),
    category: s(r.category),
    content: s(r.content),
    projectId: opt(r.project_id),
    tags: s(r.tags),
    pinned: n(r.pinned) === 1,
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const notes = {
  all(db: Database): Note[] {
    return rows(db, "SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC").map(toNote);
  },
  get(db: Database, id: string): Note | null {
    const r = rows(db, "SELECT * FROM notes WHERE id=?", [id]);
    return r.length ? toNote(r[0]) : null;
  },
  categories(db: Database): string[] {
    return rows<{ category: string }>(
      db,
      "SELECT DISTINCT category FROM notes ORDER BY category"
    ).map((r) => r.category);
  },
  create(
    db: Database,
    data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">> & { title: string }
  ): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO notes (id,title,category,content,project_id,tags,pinned,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.title,
        data.category ?? "General",
        data.content ?? "",
        data.projectId ?? null,
        data.tags ?? "",
        data.pinned ? 1 : 0,
        ts,
        ts
      ]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<Note>): void {
    const cur = notes.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE notes SET title=?, category=?, content=?, project_id=?, tags=?, pinned=?, updated_at=?
       WHERE id=?`,
      [
        next.title,
        next.category,
        next.content,
        next.projectId,
        next.tags,
        next.pinned ? 1 : 0,
        nowIso(),
        id
      ]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM notes WHERE id=?", [id]);
    run(db, "DELETE FROM recordings WHERE entity_type='note' AND entity_id=?", [id]);
  }
};

// --------------------------------------------------------------- documents

function toDoc(r: Row): Doc {
  return {
    id: s(r.id),
    name: s(r.name),
    path: s(r.path),
    folder: s(r.folder),
    ext: s(r.ext),
    size: n(r.size),
    modifiedAt: s(r.modified_at),
    revision: n(r.revision),
    contentText: s(r.content_text),
    projectId: opt(r.project_id),
    indexedAt: s(r.indexed_at)
  };
}

export const documents = {
  all(db: Database): Doc[] {
    return rows(db, "SELECT * FROM documents ORDER BY modified_at DESC").map(toDoc);
  },
  byPath(db: Database, path: string): Doc | null {
    const r = rows(db, "SELECT * FROM documents WHERE path=?", [path]);
    return r.length ? toDoc(r[0]) : null;
  },
  /**
   * Insert or update by unique path. Bumps `revision` when the file's
   * modified time changed — this is how document revisions are tracked and
   * duplicates avoided.
   */
  upsert(
    db: Database,
    data: Omit<Doc, "id" | "revision" | "indexedAt" | "projectId"> & { projectId?: string | null }
  ): "added" | "updated" | "unchanged" {
    const existing = documents.byPath(db, data.path);
    const ts = nowIso();
    if (!existing) {
      run(
        db,
        `INSERT INTO documents (id,name,path,folder,ext,size,modified_at,revision,content_text,project_id,indexed_at)
         VALUES (?,?,?,?,?,?,?,1,?,?,?)`,
        [
          newId(),
          data.name,
          data.path,
          data.folder,
          data.ext,
          data.size,
          data.modifiedAt,
          data.contentText,
          data.projectId ?? null,
          ts
        ]
      );
      return "added";
    }
    if (existing.modifiedAt === data.modifiedAt && existing.size === data.size) {
      return "unchanged";
    }
    run(
      db,
      `UPDATE documents SET name=?, folder=?, ext=?, size=?, modified_at=?, revision=revision+1,
         content_text=?, indexed_at=? WHERE path=?`,
      [data.name, data.folder, data.ext, data.size, data.modifiedAt, data.contentText, ts, data.path]
    );
    return "updated";
  },
  setProject(db: Database, id: string, projectId: string | null): void {
    run(db, "UPDATE documents SET project_id=? WHERE id=?", [projectId, id]);
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM documents WHERE id=?", [id]);
  },
  removeFolder(db: Database, folder: string): void {
    run(db, "DELETE FROM documents WHERE folder=? OR folder LIKE ?", [folder, `${folder}/%`]);
  }
};

// ------------------------------------------------------------------- ideas

function toIdea(r: Row): Idea {
  return {
    id: s(r.id),
    title: s(r.title),
    description: s(r.description),
    projectId: opt(r.project_id),
    tags: s(r.tags),
    priority: s(r.priority) as Idea["priority"],
    status: s(r.status) as Idea["status"],
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const ideas = {
  all(db: Database): Idea[] {
    return rows(db, "SELECT * FROM ideas ORDER BY created_at DESC").map(toIdea);
  },
  get(db: Database, id: string): Idea | null {
    const r = rows(db, "SELECT * FROM ideas WHERE id=?", [id]);
    return r.length ? toIdea(r[0]) : null;
  },
  create(
    db: Database,
    data: Partial<Omit<Idea, "id" | "createdAt" | "updatedAt">> & { title: string }
  ): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO ideas (id,title,description,project_id,tags,priority,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.title,
        data.description ?? "",
        data.projectId ?? null,
        data.tags ?? "",
        data.priority ?? "medium",
        data.status ?? "new",
        ts,
        ts
      ]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<Idea>): void {
    const cur = ideas.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE ideas SET title=?, description=?, project_id=?, tags=?, priority=?, status=?, updated_at=?
       WHERE id=?`,
      [next.title, next.description, next.projectId, next.tags, next.priority, next.status, nowIso(), id]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM ideas WHERE id=?", [id]);
  }
};

// ----------------------------------------------------------------- journal

function toJournal(r: Row): JournalEntry {
  return {
    id: s(r.id),
    date: s(r.date),
    goals: s(r.goals),
    completed: s(r.completed),
    problems: s(r.problems),
    lessons: s(r.lessons),
    ideas: s(r.ideas),
    tomorrow: s(r.tomorrow),
    mood: s(r.mood),
    timeSpentMinutes: n(r.time_spent_minutes),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const journal = {
  all(db: Database): JournalEntry[] {
    return rows(db, "SELECT * FROM journal ORDER BY date DESC").map(toJournal);
  },
  /** Get the page for a date, creating it on first access (auto journal). */
  forDate(db: Database, date: string): JournalEntry {
    const r = rows(db, "SELECT * FROM journal WHERE date=?", [date]);
    if (r.length) return toJournal(r[0]);
    const ts = nowIso();
    const id = newId();
    run(db, "INSERT INTO journal (id,date,created_at,updated_at) VALUES (?,?,?,?)", [
      id,
      date,
      ts,
      ts
    ]);
    return journal.forDate(db, date);
  },
  peek(db: Database, date: string): JournalEntry | null {
    const r = rows(db, "SELECT * FROM journal WHERE date=?", [date]);
    return r.length ? toJournal(r[0]) : null;
  },
  update(db: Database, date: string, data: Partial<JournalEntry>): void {
    const cur = journal.forDate(db, date);
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE journal SET goals=?, completed=?, problems=?, lessons=?, ideas=?, tomorrow=?, mood=?,
         time_spent_minutes=?, updated_at=? WHERE date=?`,
      [
        next.goals,
        next.completed,
        next.problems,
        next.lessons,
        next.ideas,
        next.tomorrow,
        next.mood,
        next.timeSpentMinutes,
        nowIso(),
        date
      ]
    );
  },
  between(db: Database, fromDate: string, toDate: string): JournalEntry[] {
    return rows(db, "SELECT * FROM journal WHERE date >= ? AND date <= ? ORDER BY date", [
      fromDate,
      toDate
    ]).map(toJournal);
  }
};

// ---------------------------------------------------------------- learning

function toTopic(r: Row): LearningTopic {
  return {
    id: s(r.id),
    name: s(r.name),
    area: s(r.area),
    progress: n(r.progress),
    notes: s(r.notes),
    exercises: s(r.exercises),
    projects: s(r.projects),
    nextLesson: s(r.next_lesson),
    weakAreas: s(r.weak_areas),
    reviewDate: opt(r.review_date),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const learning = {
  all(db: Database): LearningTopic[] {
    return rows(db, "SELECT * FROM learning_topics ORDER BY name").map(toTopic);
  },
  get(db: Database, id: string): LearningTopic | null {
    const r = rows(db, "SELECT * FROM learning_topics WHERE id=?", [id]);
    return r.length ? toTopic(r[0]) : null;
  },
  create(db: Database, data: { name: string; area: string }): string {
    const id = newId();
    const ts = nowIso();
    run(
      db,
      `INSERT INTO learning_topics (id,name,area,progress,created_at,updated_at) VALUES (?,?,?,0,?,?)`,
      [id, data.name, data.area, ts, ts]
    );
    return id;
  },
  update(db: Database, id: string, data: Partial<LearningTopic>): void {
    const cur = learning.get(db, id);
    if (!cur) return;
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE learning_topics SET name=?, area=?, progress=?, notes=?, exercises=?, projects=?,
         next_lesson=?, weak_areas=?, review_date=?, updated_at=? WHERE id=?`,
      [
        next.name,
        next.area,
        Math.max(0, Math.min(100, next.progress)),
        next.notes,
        next.exercises,
        next.projects,
        next.nextLesson,
        next.weakAreas,
        next.reviewDate,
        nowIso(),
        id
      ]
    );
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM learning_topics WHERE id=?", [id]);
  }
};

// ----------------------------------------------------------- weekly review

function toReview(r: Row): WeeklyReview {
  return {
    id: s(r.id),
    weekStart: s(r.week_start),
    achievements: s(r.achievements),
    blockers: s(r.blockers),
    reflection: s(r.reflection),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at)
  };
}

export const weeklyReviews = {
  peek(db: Database, weekStartDay: string): WeeklyReview | null {
    const r = rows(db, "SELECT * FROM weekly_reviews WHERE week_start=?", [weekStartDay]);
    return r.length ? toReview(r[0]) : null;
  },
  forWeek(db: Database, weekStartDay: string): WeeklyReview {
    const r = rows(db, "SELECT * FROM weekly_reviews WHERE week_start=?", [weekStartDay]);
    if (r.length) return toReview(r[0]);
    const ts = nowIso();
    run(db, "INSERT INTO weekly_reviews (id,week_start,created_at,updated_at) VALUES (?,?,?,?)", [
      newId(),
      weekStartDay,
      ts,
      ts
    ]);
    return weeklyReviews.forWeek(db, weekStartDay);
  },
  update(db: Database, weekStartDay: string, data: Partial<WeeklyReview>): void {
    const cur = weeklyReviews.forWeek(db, weekStartDay);
    const next = { ...cur, ...data };
    run(
      db,
      `UPDATE weekly_reviews SET achievements=?, blockers=?, reflection=?, updated_at=? WHERE week_start=?`,
      [next.achievements, next.blockers, next.reflection, nowIso(), weekStartDay]
    );
  }
};

// ---------------------------------------------------------------- personas

function toPersona(r: Row): Persona {
  return {
    id: s(r.id),
    name: s(r.name),
    role: s(r.role),
    prompt: s(r.prompt),
    updatedAt: s(r.updated_at)
  };
}

export const personas = {
  all(db: Database): Persona[] {
    return rows(db, "SELECT * FROM personas ORDER BY name").map(toPersona);
  },
  update(db: Database, id: string, prompt: string): void {
    run(db, "UPDATE personas SET prompt=?, updated_at=? WHERE id=?", [prompt, nowIso(), id]);
  }
};

// -------------------------------------------------------------- recordings

function toRecording(r: Row): Recording {
  return {
    id: s(r.id),
    title: s(r.title),
    entityType: s(r.entity_type) as Recording["entityType"],
    entityId: s(r.entity_id),
    mime: s(r.mime),
    durationSeconds: n(r.duration_seconds),
    size: n(r.size),
    createdAt: s(r.created_at)
  };
}

export const recordings = {
  forEntity(db: Database, entityType: string, entityId: string): Recording[] {
    return rows(
      db,
      "SELECT * FROM recordings WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC",
      [entityType, entityId]
    ).map(toRecording);
  },
  create(db: Database, data: Omit<Recording, "createdAt">): void {
    run(
      db,
      `INSERT INTO recordings (id,title,entity_type,entity_id,mime,duration_seconds,size,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        data.id,
        data.title,
        data.entityType,
        data.entityId,
        data.mime,
        data.durationSeconds,
        data.size,
        nowIso()
      ]
    );
  },
  rename(db: Database, id: string, title: string): void {
    run(db, "UPDATE recordings SET title=? WHERE id=?", [title, id]);
  },
  remove(db: Database, id: string): void {
    run(db, "DELETE FROM recordings WHERE id=?", [id]);
  }
};

// ---------------------------------------------------------------- settings

export const settings = {
  get(db: Database): AppSettings {
    const r = rows<{ value: string }>(db, "SELECT value FROM settings WHERE key='app'");
    if (!r.length) return DEFAULT_SETTINGS;
    try {
      // Merge over defaults so new fields appear for existing databases.
      const parsed = JSON.parse(r[0].value) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        workingHours: { ...DEFAULT_SETTINGS.workingHours, ...parsed.workingHours },
        learningHours: { ...DEFAULT_SETTINGS.learningHours, ...parsed.learningHours },
        ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
        integrations: { ...DEFAULT_SETTINGS.integrations, ...parsed.integrations }
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  set(db: Database, next: AppSettings): void {
    run(
      db,
      "INSERT INTO settings (key,value) VALUES ('app',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [JSON.stringify(next)]
    );
  }
};
