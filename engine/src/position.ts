// Position engine: given a student's Classroom history, figure out where they are
// in a subject's sequence and what the next booklet should be.
//
// State is DERIVED here, not stored: we read the history, find the most recent
// main booklet for the subject, and look up the next one.
//
// NOTE on the two math tracks (Basic Thinking vs Critical Thinking): legacy titles
// are bare "level-booklet" with no track marker, so they cannot be told apart from
// the title alone. Pass `track` on a HistoryItem to disambiguate going forward
// (the app stores the track in the Classroom description metadata it writes).

import * as curriculum from "./curriculum.ts";
import { parseTitle } from "./parser.ts";
import type { BookletRef, CurriculumMeta, Subject } from "./types.ts";

export interface HistoryItem {
  title: string;
  /** ISO timestamp if known; used to order newest-first. */
  createdAt?: string;
  /** Optional track tag for math ("basic" | "critical") from description metadata. */
  track?: string;
}

export interface Suggestion {
  subject: Subject;
  /** The most recent booklet found in history, if any. */
  current?: BookletRef;
  currentMeta?: CurriculumMeta;
  /** The suggested next booklet to log, if any. */
  next?: BookletRef;
  nextMeta?: CurriculumMeta;
  /** True when the student has finished the whole subject sequence. */
  atEndOfCurriculum: boolean;
  /** True when no main booklet for this subject was found in history. */
  noHistory: boolean;
}

/** Order history newest-first. Items with timestamps sort by them; the rest keep input order. */
function orderNewestFirst(history: HistoryItem[]): HistoryItem[] {
  const withDate = history.filter((h) => h.createdAt);
  const withoutDate = history.filter((h) => !h.createdAt);
  withDate.sort((a, b) => (a.createdAt! < b.createdAt! ? 1 : -1));
  // Assume callers pass undated history already newest-first (as the Stream shows).
  return [...withDate, ...withoutDate];
}

/**
 * Find the most recent main booklet for `subject` and suggest the next one.
 * @param opts.track  restrict to math items tagged with this track.
 */
export function suggestNext(
  history: HistoryItem[],
  subject: Subject,
  opts: { track?: string } = {},
): Suggestion {
  const ordered = orderNewestFirst(history);
  const wantKind = subject === "math" ? "math-booklet" : "english-booklet";

  let current: BookletRef | undefined;
  for (const item of ordered) {
    if (opts.track && item.track && item.track !== opts.track) continue;
    const parsed = parseTitle(item.title);
    if (parsed.kind !== wantKind) continue;
    if (parsed.level === undefined || parsed.booklet === undefined) continue;
    const ref: BookletRef = { subject, level: parsed.level, booklet: parsed.booklet };
    if (!curriculum.exists(ref)) continue; // ignore typos that don't map to a real booklet
    current = ref;
    break;
  }

  if (!current) {
    return { subject, atEndOfCurriculum: false, noHistory: true };
  }

  const nextRef = curriculum.next(current);
  return {
    subject,
    current,
    currentMeta: curriculum.getMeta(current),
    next: nextRef,
    nextMeta: nextRef ? curriculum.getMeta(nextRef) : undefined,
    atEndOfCurriculum: nextRef === undefined,
    noHistory: false,
  };
}
