/**
 * SQLite schema, applied as ordered migrations. To evolve the schema in a
 * later version, append a new entry — never edit an existing one. The current
 * version is stored in the `meta` table (owned by the migrator in
 * database.ts) and migrations at or below it are skipped.
 */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    goals TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    project_id TEXT,
    category TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'todo',
    meeting_id TEXT,
    document_id TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );
  CREATE INDEX idx_tasks_status ON tasks(status);
  CREATE INDEX idx_tasks_due ON tasks(due_date);
  CREATE INDEX idx_tasks_project ON tasks(project_id);
  CREATE INDEX idx_tasks_meeting ON tasks(meeting_id);

  CREATE TABLE meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    attendees TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    project_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_meetings_date ON meetings(date);

  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    content TEXT NOT NULL DEFAULT '',
    project_id TEXT,
    tags TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_notes_category ON notes(category);

  CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    folder TEXT NOT NULL DEFAULT '',
    ext TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    modified_at TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL DEFAULT 1,
    content_text TEXT NOT NULL DEFAULT '',
    project_id TEXT,
    indexed_at TEXT NOT NULL
  );

  CREATE TABLE ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    project_id TEXT,
    tags TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE journal (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    goals TEXT NOT NULL DEFAULT '',
    completed TEXT NOT NULL DEFAULT '',
    problems TEXT NOT NULL DEFAULT '',
    lessons TEXT NOT NULL DEFAULT '',
    ideas TEXT NOT NULL DEFAULT '',
    tomorrow TEXT NOT NULL DEFAULT '',
    mood TEXT NOT NULL DEFAULT '',
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE learning_topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    progress INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    exercises TEXT NOT NULL DEFAULT '',
    projects TEXT NOT NULL DEFAULT '',
    next_lesson TEXT NOT NULL DEFAULT '',
    weak_areas TEXT NOT NULL DEFAULT '',
    review_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE weekly_reviews (
    id TEXT PRIMARY KEY,
    week_start TEXT NOT NULL UNIQUE,
    achievements TEXT NOT NULL DEFAULT '',
    blockers TEXT NOT NULL DEFAULT '',
    reflection TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE personas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    prompt TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `
];
