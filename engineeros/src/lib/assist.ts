/**
 * Local assistant: deterministic, on-device text intelligence.
 *
 * Version 1 runs fully offline — no API calls, no keys, nothing leaves the
 * device. The functions here generate meeting summaries and weekly
 * reflections from your own data using transparent heuristics. The AI
 * settings (provider/endpoint/key) and the persona prompts in the database
 * are the extension point for Version 2, where these same call sites can be
 * routed to a hosted model instead.
 */

import type { Task } from "../types";

const ACTION_HINTS =
  /\b(action|todo|to-do|follow[ -]?up|need(?:s)? to|must|will (?:send|check|verify|schedule|update|review|confirm)|assign|due|by (?:monday|tuesday|wednesday|thursday|friday|eod|eow|tomorrow))\b/i;

export interface MeetingDigest {
  summary: string;
  actionItems: string[];
}

/** Summarize typed meeting notes and pull out likely action items. */
export function summarizeMeetingNotes(notes: string): MeetingDigest {
  const lines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const actionItems: string[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    const bare = line.replace(/^[-*•\d.)\s\[\]x]+/i, "").trim();
    if (!bare) continue;
    if (ACTION_HINTS.test(line)) {
      actionItems.push(bare);
    } else {
      contentLines.push(bare);
    }
  }

  // Keep the most information-dense lines: prefer longer, earlier lines.
  const keyPoints = contentLines
    .map((text, i) => ({ text, score: Math.min(text.length, 160) - i * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p) => p.text);
  // Restore original order for readability.
  keyPoints.sort((a, b) => contentLines.indexOf(a) - contentLines.indexOf(b));

  const parts: string[] = [];
  if (keyPoints.length) {
    parts.push("Key points:\n" + keyPoints.map((p) => `• ${p}`).join("\n"));
  }
  if (actionItems.length) {
    parts.push("Action items:\n" + actionItems.map((a) => `→ ${a}`).join("\n"));
  }
  return {
    summary: parts.join("\n\n") || "No substantive notes to summarize yet.",
    actionItems
  };
}

export interface WeekStats {
  tasksCompleted: number;
  tasksCreated: number;
  overdueOpen: number;
  blockedOpen: Task[];
  minutesWorked: number;
  learningMinutesGoal: number;
  ideasCaptured: number;
  lessons: string[];
  problems: string[];
  projectsAdvanced: string[];
  weeklyTaskGoal: number;
}

/** Rule-based weekly reflection with concrete recommendations. */
export function weeklyReflection(stats: WeekStats): string {
  const out: string[] = [];

  const goalPct =
    stats.weeklyTaskGoal > 0
      ? Math.round((stats.tasksCompleted / stats.weeklyTaskGoal) * 100)
      : 0;
  out.push(
    `You completed ${stats.tasksCompleted} task${stats.tasksCompleted === 1 ? "" : "s"} this week` +
      (stats.weeklyTaskGoal > 0 ? ` — ${goalPct}% of your goal of ${stats.weeklyTaskGoal}.` : ".")
  );

  if (stats.minutesWorked > 0) {
    out.push(
      `You logged ${Math.round(stats.minutesWorked / 60)}h ${stats.minutesWorked % 60}m of tracked time in your journal.`
    );
  } else {
    out.push(
      "No time was logged in the journal this week — logging even rough hours makes the weekly picture much more useful."
    );
  }

  if (stats.projectsAdvanced.length) {
    out.push(`Projects advanced: ${stats.projectsAdvanced.join(", ")}.`);
  }

  if (stats.ideasCaptured > 0) {
    out.push(`You captured ${stats.ideasCaptured} idea${stats.ideasCaptured === 1 ? "" : "s"} — keep that habit.`);
  }

  const recs: string[] = [];
  if (stats.overdueOpen > 0) {
    recs.push(
      `Clear the backlog first: ${stats.overdueOpen} open task${stats.overdueOpen === 1 ? " is" : "s are"} past due. Re-date or finish them Monday morning before taking new work.`
    );
  }
  if (stats.blockedOpen.length > 0) {
    const names = stats.blockedOpen.slice(0, 3).map((t) => `"${t.title}"`).join(", ");
    recs.push(
      `Recurring blockers: ${names}${stats.blockedOpen.length > 3 ? "…" : ""}. For each, write down who or what unblocks it and send that request early in the week.`
    );
  }
  if (stats.tasksCreated > stats.tasksCompleted * 1.5 && stats.tasksCreated > 5) {
    recs.push(
      `Intake outpaced completion (${stats.tasksCreated} new vs ${stats.tasksCompleted} done). Be stricter about what becomes a task vs. a note or idea.`
    );
  }
  if (goalPct >= 100) {
    recs.push("You hit your weekly goal — consider raising it slightly or investing the margin into learning.");
  } else if (goalPct > 0 && goalPct < 50) {
    recs.push("Under 50% of the weekly goal: either the goal is too ambitious or the week was interrupt-driven. Pick 3 must-finish tasks for next week and protect time for them.");
  }
  if (stats.problems.length > 0) {
    recs.push("Review the problems you journaled and pick one to permanently fix with a checklist or a script.");
  }
  if (recs.length === 0) {
    recs.push("Solid week. Keep the same rhythm and use any spare margin on your weakest learning area.");
  }

  out.push("\nRecommendations for next week:");
  recs.forEach((r, i) => out.push(`${i + 1}. ${r}`));

  if (stats.lessons.length) {
    out.push("\nLessons worth keeping (from your journal):");
    stats.lessons.slice(0, 5).forEach((l) => out.push(`• ${l}`));
  }

  return out.join("\n");
}
