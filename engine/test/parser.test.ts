import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTitle } from "../src/parser.ts";

// Real titles observed in the Classroom screenshots and the Classroom Log Decoder sheet.

test("math booklets, including messy real-world spacing/case", () => {
  assert.deepEqual(
    { ...parseTitle("16-2"), raw: undefined },
    { raw: undefined, kind: "math-booklet", isCurriculumLog: true, subject: "math", level: "16", booklet: 2, hardCopy: false },
  );
  const hc = parseTitle("12-26 HC");
  assert.equal(hc.kind, "math-booklet");
  assert.equal(hc.level, "12");
  assert.equal(hc.booklet, 26);
  assert.equal(hc.hardCopy, true);

  // lowercase hc
  assert.equal(parseTitle("14-14 hc").hardCopy, true);
  // stray space before the dash
  const spaced = parseTitle("14 -13 HC");
  assert.equal(spaced.level, "14");
  assert.equal(spaced.booklet, 13);
  assert.equal(spaced.hardCopy, true);
  // trailing period from Stream prose
  assert.equal(parseTitle("16-1.").booklet, 1);
});

test("english main booklets", () => {
  const h7 = parseTitle("H7");
  assert.equal(h7.kind, "english-booklet");
  assert.equal(h7.subject, "english");
  assert.equal(h7.level, "H");
  assert.equal(h7.booklet, 7);

  assert.equal(parseTitle("H6").booklet, 6);
  assert.equal(parseTitle("G12").level, "G");

  const preA = parseTitle("Pre-A-7");
  assert.equal(preA.level, "Pre-A");
  assert.equal(preA.booklet, 7);

  const l5 = parseTitle("L5-23");
  assert.equal(l5.kind, "english-booklet");
  assert.equal(l5.level, "L5");
  assert.equal(l5.booklet, 23);
});

test("supplementary math: extra practice and logic", () => {
  const ep = parseTitle("extra practice 3a pt 16");
  assert.equal(ep.kind, "extra-practice");
  assert.equal(ep.subject, "math");
  assert.equal(ep.gradeLabel, "3a");
  assert.equal(ep.part, 16);

  const logic = parseTitle("Logic B2-10");
  assert.equal(logic.kind, "logic");
  assert.equal(logic.gradeLabel, "B2");
  assert.equal(logic.part, 10);
});

test("english supplementary series", () => {
  const wr = parseTitle("Word Roots Gr3 part 9");
  assert.equal(wr.kind, "series");
  assert.equal(wr.seriesName, "Word Roots");
  assert.equal(wr.gradeLabel, "Gr3");
  assert.equal(wr.part, 9);

  const sel = parseTitle("Selection Gr4 Part 6");
  assert.equal(sel.seriesName, "Selection");
  assert.equal(sel.part, 6);

  assert.equal(parseTitle("DGP week 12").kind, "grammar");
  assert.equal(parseTitle("SAT Vocab unit 7").kind, "vocab");
  assert.equal(parseTitle("SAT Reading section 3").kind, "reading");
  assert.equal(parseTitle("February Writing 2026 - Creative writing").kind, "writing");
});

test("non-curriculum titles are flagged", () => {
  const quiz = parseTitle("teacher account posted via Wayground (formerly Quizizz): Gr 3 prep");
  assert.equal(quiz.kind, "quiz");
  assert.equal(quiz.isCurriculumLog, false);

  assert.equal(parseTitle("Summer Hours for 2026").kind, "announcement");
  assert.equal(parseTitle("End of Year Exam 2026").kind, "announcement");
  assert.equal(parseTitle("Summer Hours for 2026").isCurriculumLog, false);
});

test("curriculum logs are marked isCurriculumLog regardless of author", () => {
  // Admin-posted booklet logs are still real logs.
  assert.equal(parseTitle("H6").isCurriculumLog, true);
  assert.equal(parseTitle("12-25 HC").isCurriculumLog, true);
});
