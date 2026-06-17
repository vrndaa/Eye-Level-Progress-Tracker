// Curriculum data access: lookup a booklet's metadata, and walk the sequence
// forward/backward. Both math tracks (Basic Thinking + Critical Thinking) share
// the same level-booklet sequence, so one math sequence serves both.

import mathData from "../data/math.json" with { type: "json" };
import englishData from "../data/english.json" with { type: "json" };
import type {
  BookletRef,
  EnglishBooklet,
  MathBooklet,
  Subject,
} from "./types.ts";

const math = mathData as { subject: "math"; levels: string[]; booklets: MathBooklet[] };
const english = englishData as {
  subject: "english";
  levels: string[];
  booklets: EnglishBooklet[];
};

function key(level: string, booklet: number): string {
  return `${level}#${booklet}`;
}

// Build ordered indexes once at module load.
const mathIndex = new Map<string, number>();
math.booklets.forEach((b, i) => mathIndex.set(key(b.level, b.position), i));

const englishIndex = new Map<string, number>();
english.booklets.forEach((b, i) => englishIndex.set(key(b.level, b.position), i));

export const levels = {
  math: math.levels,
  english: english.levels,
};

export const counts = {
  math: math.booklets.length,
  english: english.booklets.length,
};

/** The full ordered math sequence (690 booklets). */
export function allMath(): MathBooklet[] {
  return math.booklets;
}

/** The full ordered english sequence (620 booklets). */
export function allEnglish(): EnglishBooklet[] {
  return english.booklets;
}

/** Look up the metadata for a booklet. Returns undefined if it isn't in the curriculum. */
export function getMeta(ref: BookletRef): MathBooklet | EnglishBooklet | undefined {
  if (ref.subject === "math") {
    const i = mathIndex.get(key(ref.level, ref.booklet));
    return i === undefined ? undefined : math.booklets[i];
  }
  const i = englishIndex.get(key(ref.level, ref.booklet));
  return i === undefined ? undefined : english.booklets[i];
}

/** True if the (level, booklet) pair exists in the subject's sequence. */
export function exists(ref: BookletRef): boolean {
  return getMeta(ref) !== undefined;
}

function step(subject: Subject, level: string, booklet: number, delta: number): BookletRef | undefined {
  const index = subject === "math" ? mathIndex : englishIndex;
  const list = subject === "math" ? math.booklets : english.booklets;
  const i = index.get(key(level, booklet));
  if (i === undefined) return undefined;
  const target = list[i + delta];
  if (!target) return undefined;
  return { subject, level: target.level, booklet: target.position };
}

/** The next booklet in sequence (across level boundaries), or undefined at the end. */
export function next(ref: BookletRef): BookletRef | undefined {
  return step(ref.subject, ref.level, ref.booklet, +1);
}

/** The previous booklet in sequence, or undefined at the start. */
export function prev(ref: BookletRef): BookletRef | undefined {
  return step(ref.subject, ref.level, ref.booklet, -1);
}

/** True if this booklet is the final one in the whole subject sequence. */
export function isLast(ref: BookletRef): boolean {
  return exists(ref) && next(ref) === undefined;
}
