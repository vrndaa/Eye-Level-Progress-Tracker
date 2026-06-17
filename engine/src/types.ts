// Core domain types for the Enopi SMILE engine.
// These describe what a Google Classroom assignment TITLE means once decoded.

export type Subject = "math" | "english";

/**
 * What a Classroom assignment title represents.
 * Only the *-booklet, extra-practice, logic, series, grammar, vocab, reading and
 * writing kinds are real curriculum logs; quiz/announcement/unknown are not.
 */
export type LogKind =
  | "math-booklet" // "16-2", "12-26 HC"
  | "english-booklet" // "H7", "Pre-A-3", "L5-23"
  | "extra-practice" // "extra practice 3a pt 16"
  | "logic" // "Logic B2-10"
  | "series" // "Selection Gr4 Part 6", "Word Roots Gr3 part 9", "Classic Series Gr3 part 4"
  | "grammar" // "DGP week 12"
  | "vocab" // "SAT Vocab unit 7"
  | "reading" // "SAT Reading section 3"
  | "writing" // "February Writing 2026 - Creative writing"
  | "quiz" // "... via Wayground (formerly Quizizz): ..."
  | "announcement" // "Summer Hours for 2026", "End of Year Exam 2026"
  | "unknown";

/** Result of decoding a single Classroom title. */
export interface ParsedTitle {
  raw: string;
  kind: LogKind;
  /** True only for kinds that record a student's curriculum work. */
  isCurriculumLog: boolean;
  subject?: Subject;
  /** Level as written in the curriculum: "16", "H", "Pre-A", "L5". */
  level?: string;
  /** Booklet / position number within the level. */
  booklet?: number;
  /** Math hard-copy flag (HC = physical printed booklet). */
  hardCopy?: boolean;
  /** Supplementary-series name, e.g. "extra practice", "Logic", "Word Roots". */
  seriesName?: string;
  /** Part / unit / week / section / pt number for supplementary kinds. */
  part?: number;
  /** Series grade label, e.g. "3a", "Gr4" — the MATERIAL level, not the student's grade. */
  gradeLabel?: string;
}

/** A pointer to one main-sequence booklet. The unit the position engine moves through. */
export interface BookletRef {
  subject: Subject;
  level: string;
  booklet: number;
  hardCopy?: boolean;
}

export interface MathBooklet {
  level: string;
  position: number;
  code: string;
  strand: string;
  strandName: string;
  topic: string;
}

export interface EnglishBooklet {
  level: string;
  position: number;
  code: string;
  readingTopic: string;
  writingComponent: string;
  gradeRange: string;
  verify: boolean;
}

export type CurriculumMeta = MathBooklet | EnglishBooklet;

/**
 * A sequenced track a student progresses through. The two math tracks run in
 * parallel (Critical Thinking trails Basic Thinking by a few levels); English is
 * a single track. These mirror the columns on the paper SMILE form.
 */
export type TrackId = "math-basic" | "math-critical" | "english";

/** A student. `id` maps to their individual Google Classroom courseId later. */
export interface Student {
  id: string;
  name: string;
  grade: string; // e.g. "Gr 4"
  tracks: TrackId[]; // the sequenced tracks this student is enrolled in
}
