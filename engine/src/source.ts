// The seam between the app and "where the data lives".
//
// Today the only implementation is FakeClassroomSource (in-memory demo data).
// In Phase 2, a GoogleClassroomSource will implement this SAME interface using
// the Classroom API — and nothing above this layer (session service, future UI)
// has to change. Everything is async because the real version makes network calls.

import type { HistoryItem } from "./position.ts";
import type { Student, Subject, TrackId } from "./types.ts";

/** Structured metadata stashed in a Classroom assignment's (otherwise empty) description. */
export interface LogMetadata {
  v: 1;
  subject: Subject;
  track: TrackId;
  level: string;
  booklet: number;
  hardCopy: boolean;
  teacher: string;
  loggedAt: string; // ISO timestamp
  comment?: string;
}

/** One entry to write: the visible title plus the hidden structured metadata. */
export interface ClassroomPost {
  studentId: string;
  title: string; // the visible Stream title, identical to today's convention
  description: LogMetadata; // invisible-in-summary structured detail
}

export interface ClassroomSource {
  listStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  /** A student's coursework, newest first. */
  getHistory(id: string): Promise<HistoryItem[]>;
  /** Create a new coursework item (the WRITE). Returns the history item it became. */
  postLog(post: ClassroomPost): Promise<HistoryItem>;
}
