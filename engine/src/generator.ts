// Title Generator: turn a structured booklet selection into the exact Classroom
// title string the center already uses, so the Stream looks unchanged.
//
// Format rules (ground truth: screenshots + decoder sheet):
//   Math:            "16-2", with " HC" suffix for hard copy -> "12-26 HC"
//   English A..I:    "H7"  (letter + number, NO separator)
//   English Pre-A:   "Pre-A-7"  (dash, to stay readable)
//   English L5..L8:  "L5-23"  (dash)

import type { BookletRef } from "./types.ts";

export function generateTitle(ref: BookletRef): string {
  if (ref.subject === "math") {
    const base = `${ref.level}-${ref.booklet}`;
    return ref.hardCopy ? `${base} HC` : base;
  }

  // english
  if (ref.level === "Pre-A") return `Pre-A-${ref.booklet}`;
  if (/^[A-I]$/.test(ref.level)) return `${ref.level}${ref.booklet}`;
  if (/^L[5-8]$/.test(ref.level)) return `${ref.level}-${ref.booklet}`;

  // Fallback for any unexpected level shape: dash form.
  return `${ref.level}-${ref.booklet}`;
}
