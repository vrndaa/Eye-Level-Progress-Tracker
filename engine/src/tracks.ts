// Maps each track to its subject and the short tag used in history/metadata.
// One place to change if track definitions ever evolve.

import type { Student, Subject, TrackId } from "./types.ts";

export interface TrackInfo {
  subject: Subject;
  label: string;
  /** Short tag stored in Classroom description metadata + fake history, or undefined. */
  tag?: string;
}

export const TRACK_INFO: Record<TrackId, TrackInfo> = {
  "math-basic": { subject: "math", label: "Basic Thinking Math", tag: "basic" },
  "math-critical": { subject: "math", label: "Critical Thinking Math", tag: "critical" },
  english: { subject: "english", label: "English" },
};

/** The distinct subjects a student is enrolled in, derived from their tracks. */
export function enrolledSubjects(student: Student): Subject[] {
  const set = new Set<Subject>();
  for (const t of student.tracks) set.add(TRACK_INFO[t].subject);
  return [...set];
}
