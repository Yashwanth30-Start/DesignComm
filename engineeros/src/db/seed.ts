import type { Database } from "sql.js";
import { newId, nowIso } from "../lib/id";
import type { AppSettings } from "../types";

/**
 * First-run content: the five Version 1 projects, the learning tracks, the
 * six AI personas (editable Markdown prompts) and default settings.
 * Runs only when the projects table is empty, so user data is never touched.
 */

export const DEFAULT_SETTINGS: AppSettings = {
  userName: "Yashwanth",
  workingHours: { start: "07:00", end: "16:00" },
  learningHours: { start: "19:00", end: "21:00" },
  defaultPriority: "medium",
  weeklyTaskGoal: 15,
  weeklyLearningGoalMinutes: 600,
  accent: "cyan",
  documentExtensions: [
    "md", "txt", "csv", "json", "js", "ts", "html", "py",
    "pdf", "docx", "xlsx", "pptx", "dwg"
  ],
  ai: {
    provider: "local",
    endpoint: "",
    model: "",
    apiKey: ""
  },
  integrations: { microsoft365: false }
};

export const KNOWLEDGE_CATEGORIES = [
  "Construction",
  "Facility Grid",
  "Commissioning",
  "Electrical",
  "Fire Alarm",
  "QA/QC",
  "Automation",
  "JavaScript",
  "HTML",
  "Python",
  "AI",
  "Machine Learning",
  "Leadership",
  "Career",
  "General"
];

const DEFAULT_PROJECTS: Array<{ name: string; description: string; goals: string }> = [
  {
    name: "CommissionOS",
    description:
      "Commissioning workspace: dashboards, panel schedules and workflow tooling for electrical commissioning.",
    goals: "Ship a reliable commissioning dashboard that the field team actually uses."
  },
  {
    name: "Facility Grid",
    description:
      "Everything related to Facility Grid: asset tracking, checklists, automation and reporting.",
    goals: "Automate repetitive Facility Grid data entry and build better reports."
  },
  {
    name: "Construction Automation",
    description:
      "Scripts and tools (Tampermonkey, Airtable, JavaScript) that remove manual work from construction documentation.",
    goals: "Every repetitive workflow gets a script."
  },
  {
    name: "Innovation",
    description:
      "Experiments, prototypes and ideas that could become tools — AI, dashboards, new workflows.",
    goals: "Turn at least one idea per quarter into a working prototype."
  },
  {
    name: "Personal Learning",
    description:
      "Evening study: AI, machine learning, Python, software engineering and construction technology.",
    goals: "Consistent study every week; build real projects, not just tutorials."
  }
];

const LEARNING_TOPICS: Array<{ name: string; area: string; nextLesson: string }> = [
  { name: "Artificial Intelligence", area: "AI", nextLesson: "LLM fundamentals: prompting, context windows, tool use" },
  { name: "Machine Learning", area: "AI", nextLesson: "Supervised learning: train/test split and evaluation metrics" },
  { name: "Python", area: "Programming", nextLesson: "Working with APIs: requests, JSON and error handling" },
  { name: "JavaScript", area: "Programming", nextLesson: "Async patterns: promises, async/await, fetch" },
  { name: "Git", area: "Tools", nextLesson: "Branching strategy: feature branches and clean commits" },
  { name: "Software Architecture", area: "Engineering", nextLesson: "Separation of concerns and layered design" },
  { name: "Construction Technology", area: "Construction", nextLesson: "Digital commissioning workflows and data standards" }
];

const PERSONAS: Array<{ name: string; role: string; prompt: string }> = [
  {
    name: "Manager",
    role: "Prioritizes work",
    prompt: `# Manager

You are Yashwanth's work manager. Your job is to prioritize.

- Review open tasks, due dates and meetings.
- Rank work by impact on active construction milestones first, then by due date, then by effort.
- Flag anything overdue or blocked and propose one concrete unblocking step.
- Keep the daily plan to a maximum of 5 focus items.
- Be direct. No filler.`
  },
  {
    name: "Mentor",
    role: "Provides career advice",
    prompt: `# Mentor

You are a senior construction-technology leader mentoring Yashwanth, a construction engineer at Turner Construction specializing in QC, commissioning and automation.

- Give honest, specific career advice grounded in his real work.
- Push toward high-leverage skills: AI, automation, communication, ownership.
- When he describes a situation, name the underlying pattern before advising.
- End every session with one action he can take this week.`
  },
  {
    name: "Teacher",
    role: "Explains concepts",
    prompt: `# Teacher

You explain technical concepts clearly.

- Start from what a construction engineer already knows; use field analogies (panels, circuits, inspections, punch lists).
- Explain in three passes: intuition, mechanics, edge cases.
- Always finish with a small exercise to confirm understanding.`
  },
  {
    name: "Software Architect",
    role: "Reviews code",
    prompt: `# Software Architect

You review code and designs for Yashwanth's automation projects (JavaScript, Tampermonkey, Python, dashboards).

- Review for correctness first, then simplicity, then naming.
- Prefer boring, maintainable solutions over clever ones.
- Point out exactly what to change and why; show the improved version.
- Watch for: unhandled errors, duplicated logic, hardcoded paths, missing types.`
  },
  {
    name: "Construction Expert",
    role: "Explains construction workflows",
    prompt: `# Construction Expert

You are a veteran commissioning and QA/QC expert.

- Explain construction workflows precisely: commissioning levels, inspections, fire alarm testing, electrical systems, documentation chains.
- Reference how the workflow looks in the field vs. on paper.
- Flag common failure points and what a good engineer checks proactively.`
  },
  {
    name: "Learning Coach",
    role: "Tracks education progress",
    prompt: `# Learning Coach

You manage Yashwanth's evening learning (AI, ML, Python, software engineering).

- Review learning progress, weak areas and review dates.
- Apply spaced repetition: schedule reviews before material fades.
- Recommend the single next lesson, sized to fit the evening learning window.
- Prefer building small real projects over passive tutorials.`
  }
];

export function seedIfEmpty(db: Database): void {
  const res = db.exec("SELECT COUNT(*) FROM projects");
  const count = Number(res[0].values[0][0]);
  if (count > 0) return;

  const ts = nowIso();

  for (const p of DEFAULT_PROJECTS) {
    db.run(
      `INSERT INTO projects (id, name, description, goals, status, is_default, created_at, updated_at)
       VALUES (?,?,?,?,'active',1,?,?)`,
      [newId(), p.name, p.description, p.goals, ts, ts]
    );
  }

  for (const t of LEARNING_TOPICS) {
    db.run(
      `INSERT INTO learning_topics (id, name, area, progress, next_lesson, created_at, updated_at)
       VALUES (?,?,?,0,?,?,?)`,
      [newId(), t.name, t.area, t.nextLesson, ts, ts]
    );
  }

  for (const p of PERSONAS) {
    db.run(
      `INSERT INTO personas (id, name, role, prompt, updated_at) VALUES (?,?,?,?,?)`,
      [newId(), p.name, p.role, p.prompt, ts]
    );
  }

  db.run(
    `INSERT INTO notes (id, title, category, content, tags, pinned, created_at, updated_at)
     VALUES (?,?,?,?,?,1,?,?)`,
    [
      newId(),
      "Welcome to EngineerOS",
      "General",
      [
        "# Welcome to EngineerOS",
        "",
        "Everything here lives **on this device** — a real SQLite database persisted locally, working fully offline.",
        "",
        "## Where to start",
        "",
        "- **Dashboard** shows what to focus on next.",
        "- **Tasks** never lets work slip: priorities, due dates, durations.",
        "- **Meetings** keeps notes, summaries and action items together.",
        "- **Knowledge** is your Markdown second brain — this note is one.",
        "- **Journal** creates a page for every day automatically.",
        "- **Weekly Review** summarizes the week and suggests improvements.",
        "",
        "Configure folders, hours and AI personas in **Settings**."
      ].join("\n"),
      "welcome",
      ts,
      ts
    ]
  );

  db.run(
    "INSERT INTO settings (key, value) VALUES ('app', ?)",
    [JSON.stringify(DEFAULT_SETTINGS)]
  );
}
