// Session service: the business logic a screen (or Google integration) sits on.
//
//  buildSession() -> everything you'd show a teacher when they open a student:
//    per-track "last logged" + "suggested next", plus recent supplementary work.
//  logWork()      -> turn a teacher's choice into a Classroom post (title +
//                    structured metadata) and write it through the source.
//
// No UI and no Google here — just the logic both will reuse.

import { generateTitle } from "./generator.ts";
import { parseTitle } from "./parser.ts";
import { suggestNext, type HistoryItem, type Suggestion } from "./position.ts";
import type { ClassroomPost, ClassroomSource } from "./source.ts";
import { TRACK_INFO } from "./tracks.ts";
import type { BookletRef, ParsedTitle, Student, TrackId } from "./types.ts";

export interface TrackSession {
  track: TrackId;
  label: string;
  /** Engine result: current booklet + suggested next (or end-of-curriculum / no history). */
  suggestion: Suggestion;
}

export interface SessionView {
  student: Student;
  tracks: TrackSession[];
  /** Recent supplementary logs (extra practice, logic, series, grammar…) not on a main track. */
  supplementary: ParsedTitle[];
  generatedAt: string;
}

/** Build the full "open this student" view. */
export async function buildSession(source: ClassroomSource, studentId: string): Promise<SessionView> {
  const student = await source.getStudent(studentId);
  if (!student) throw new Error(`Unknown student: ${studentId}`);
  const history = await source.getHistory(studentId);

  const tracks: TrackSession[] = student.tracks.map((track) => {
    const info = TRACK_INFO[track];
    return {
      track,
      label: info.label,
      suggestion: suggestNext(history, info.subject, { track: info.tag }),
    };
  });

  return {
    student,
    tracks,
    supplementary: collectSupplementary(history),
    generatedAt: new Date().toISOString(),
  };
}

export interface LogRequest {
  studentId: string;
  track: TrackId;
  ref: BookletRef; // the booklet to log (level + booklet [+ hardCopy])
  teacher: string; // in-app teacher identity (Google login is shared)
  comment?: string;
}

/**
 * Record one booklet for a student. Builds the canonical title + structured
 * metadata and writes it through the source. Returns the post that was created.
 */
export async function logWork(source: ClassroomSource, req: LogRequest): Promise<ClassroomPost> {
  const info = TRACK_INFO[req.track];
  if (req.ref.subject !== info.subject) {
    throw new Error(`Track ${req.track} is ${info.subject}, but ref is ${req.ref.subject}`);
  }

  const post: ClassroomPost = {
    studentId: req.studentId,
    title: generateTitle(req.ref),
    description: {
      v: 1,
      subject: req.ref.subject,
      track: req.track,
      level: req.ref.level,
      booklet: req.ref.booklet,
      hardCopy: req.ref.hardCopy ?? false,
      teacher: req.teacher,
      loggedAt: new Date().toISOString(),
      ...(req.comment ? { comment: req.comment } : {}),
    },
  };

  await source.postLog(post);
  return post;
}

/** Convenience: log whatever each track currently suggests as "next", in one go. */
export async function logSuggestedNext(
  source: ClassroomSource,
  studentId: string,
  track: TrackId,
  teacher: string,
): Promise<ClassroomPost | undefined> {
  const view = await buildSession(source, studentId);
  const ts = view.tracks.find((t) => t.track === track);
  if (!ts?.suggestion.next) return undefined;
  return logWork(source, { studentId, track, ref: ts.suggestion.next, teacher });
}

function collectSupplementary(history: HistoryItem[]): ParsedTitle[] {
  const out: ParsedTitle[] = [];
  for (const item of history) {
    const p = parseTitle(item.title);
    if (p.isCurriculumLog && p.kind !== "math-booklet" && p.kind !== "english-booklet") {
      out.push(p);
    }
  }
  return out;
}
