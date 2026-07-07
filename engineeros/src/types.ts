// Domain model for EngineerOS. Data model before UI, always.
// Every table in db/schema.ts has a matching interface here.

export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type IdeaStatus = "new" | "exploring" | "planned" | "done" | "archived";
export type ProjectStatus = "active" | "paused" | "done";

export interface Project {
  id: string;
  name: string;
  description: string;
  goals: string;
  status: ProjectStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  projectId: string | null;
  category: string;
  dueDate: string | null; // YYYY-MM-DD
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  status: TaskStatus;
  meetingId: string | null;
  documentId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  attendees: string;
  notes: string;
  summary: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  category: string;
  content: string; // Markdown
  projectId: string | null;
  tags: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doc {
  id: string;
  name: string;
  path: string;
  folder: string;
  ext: string;
  size: number;
  modifiedAt: string;
  revision: number;
  contentText: string;
  projectId: string | null;
  indexedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  tags: string;
  priority: Priority;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD, unique
  goals: string;
  completed: string;
  problems: string;
  lessons: string;
  ideas: string;
  tomorrow: string;
  mood: string;
  timeSpentMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningTopic {
  id: string;
  name: string;
  area: string;
  progress: number; // 0..100
  notes: string;
  exercises: string;
  projects: string;
  nextLesson: string;
  weakAreas: string;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string; // Monday, YYYY-MM-DD, unique
  achievements: string;
  blockers: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  prompt: string; // editable Markdown
  updatedAt: string;
}

/** App configuration stored as JSON in the settings table. */
export interface AppSettings {
  userName: string;
  workingHours: { start: string; end: string };
  learningHours: { start: string; end: string };
  defaultPriority: Priority;
  weeklyTaskGoal: number;
  weeklyLearningGoalMinutes: number;
  accent: "cyan" | "emerald" | "purple" | "gold";
  documentExtensions: string[];
  ai: {
    provider: "local" | "anthropic" | "openai" | "azure";
    endpoint: string;
    model: string;
    // Key is stored locally only; nothing ever leaves the device in v1.
    apiKey: string;
  };
  integrations: {
    // Reserved for Version 2 (Outlook, SharePoint, Teams, Planner).
    microsoft365: boolean;
  };
}

export type SearchResultType =
  | "task"
  | "meeting"
  | "project"
  | "idea"
  | "note"
  | "document"
  | "learning"
  | "journal";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string;
  route: string;
  date?: string;
}
