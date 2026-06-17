// Title Parser: decode a messy Google Classroom assignment title into structure.
//
// Real titles are typed by humans and are inconsistent in spacing and case:
//   "16-2", "12-26 HC", "14-14 hc", "14 -13 HC", "H7", "H6", "L5-23",
//   "extra practice 3a pt 16", "Logic B2-10", "Selection Gr4 Part 6",
//   "Word Roots Gr3 part 9", "DGP week 12", "SAT Vocab unit 7",
//   "SAT Reading section 3", "February Writing 2026 - Creative writing",
//   "... via Wayground (formerly Quizizz): ...", "Summer Hours for 2026".
//
// IMPORTANT: title FORMAT (not the author) determines whether something is a
// curriculum log. Admin staff sometimes post real booklet logs.

import type { LogKind, ParsedTitle } from "./types.ts";

const NON_LOG: LogKind[] = ["quiz", "announcement", "unknown"];

function result(raw: string, kind: LogKind, fields: Partial<ParsedTitle> = {}): ParsedTitle {
  return {
    raw,
    kind,
    isCurriculumLog: !NON_LOG.includes(kind),
    ...fields,
  };
}

/** Normalize for matching: trim, strip a trailing period the Stream UI may add, collapse spaces. */
function normalize(raw: string): string {
  return raw.trim().replace(/\.\s*$/, "").replace(/\s+/g, " ").trim();
}

function num(s: string | undefined): number | undefined {
  if (s === undefined) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

export function parseTitle(raw: string): ParsedTitle {
  const t = normalize(raw);

  // --- Non-curriculum: online quizzes ---
  if (/\b(wayground|quizizz)\b/i.test(t)) {
    return result(raw, "quiz");
  }

  // --- Supplementary math: extra practice ("extra practice 3a pt 16") ---
  let m = t.match(/^extra\s+practice\s+([0-9]+[a-z]?)\s*(?:pt|part)\s*([0-9]+)$/i);
  if (m) {
    return result(raw, "extra-practice", {
      subject: "math",
      seriesName: "extra practice",
      gradeLabel: m[1],
      part: num(m[2]),
    });
  }

  // --- Supplementary math: logic ("Logic B2-10") ---
  m = t.match(/^logic\s+([a-z]?\d+)\s*-\s*(\d+)$/i);
  if (m) {
    return result(raw, "logic", {
      subject: "math",
      seriesName: "Logic",
      gradeLabel: m[1],
      part: num(m[2]),
    });
  }

  // --- English: DGP (Daily Grammar Practice) "DGP week 12" ---
  m = t.match(/^dgp\s+week\s+(\d+)$/i);
  if (m) {
    return result(raw, "grammar", { subject: "english", seriesName: "DGP", part: num(m[1]) });
  }

  // --- English: SAT prep ---
  m = t.match(/^sat\s+vocab(?:ulary)?\s+unit\s+(\d+)$/i);
  if (m) {
    return result(raw, "vocab", { subject: "english", seriesName: "SAT Vocabulary", part: num(m[1]) });
  }
  m = t.match(/^sat\s+reading\s+section\s+(\d+)$/i);
  if (m) {
    return result(raw, "reading", { subject: "english", seriesName: "SAT Reading", part: num(m[1]) });
  }

  // --- English: graded series ("Word Roots Gr3 part 9", "Selection Gr4 Part 6",
  //     "Classic Series Gr3 part 4", "Poetry Fun Gr2 part 3") ---
  m = t.match(/^(.+?)\s+gr\s*(\d+)\s+(?:part|pt)\s*(\d+)$/i);
  if (m) {
    return result(raw, "series", {
      subject: "english",
      seriesName: m[1]!.trim(),
      gradeLabel: `Gr${m[2]}`,
      part: num(m[3]),
    });
  }

  // --- English: writing assignments (descriptive titles containing "writing") ---
  if (/\bwriting\b/i.test(t)) {
    return result(raw, "writing", { subject: "english" });
  }

  // --- English main booklet: single-letter levels "H7" / "Pre-A-3" (Pre-A..I) ---
  m = t.match(/^(pre-a|[a-i])\s*-?\s*(\d{1,2})$/i);
  if (m) {
    const lvl = m[1]!.toLowerCase() === "pre-a" ? "Pre-A" : m[1]!.toUpperCase();
    return result(raw, "english-booklet", { subject: "english", level: lvl, booklet: num(m[2]) });
  }

  // --- English main booklet: "L5-23" (L5..L8) ---
  m = t.match(/^(l[5-8])\s*-\s*(\d{1,2})$/i);
  if (m) {
    return result(raw, "english-booklet", {
      subject: "english",
      level: m[1]!.toUpperCase(),
      booklet: num(m[2]),
    });
  }

  // --- Math main booklet: "16-2", "12-26 HC", "14-14 hc", "14 -13 HC" ---
  m = t.match(/^(\d{1,2})\s*-\s*(\d{1,2})(?:\s+(hc))?$/i);
  if (m) {
    return result(raw, "math-booklet", {
      subject: "math",
      level: m[1],
      booklet: num(m[2]),
      hardCopy: m[3] !== undefined,
    });
  }

  // --- Non-curriculum: admin announcements (heuristic, no structured pattern) ---
  if (/\b(hours|exam|holiday|closed|orientation|reminder|schedule|announcement|registration|tuition)\b/i.test(t)) {
    return result(raw, "announcement");
  }

  return result(raw, "unknown");
}
