import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTitle } from "../src/generator.ts";
import { parseTitle } from "../src/parser.ts";
import * as curriculum from "../src/curriculum.ts";
import type { BookletRef } from "../src/types.ts";

test("generates the center's exact title formats", () => {
  assert.equal(generateTitle({ subject: "math", level: "16", booklet: 2 }), "16-2");
  assert.equal(generateTitle({ subject: "math", level: "12", booklet: 26, hardCopy: true }), "12-26 HC");
  assert.equal(generateTitle({ subject: "english", level: "H", booklet: 7 }), "H7");
  assert.equal(generateTitle({ subject: "english", level: "Pre-A", booklet: 7 }), "Pre-A-7");
  assert.equal(generateTitle({ subject: "english", level: "L5", booklet: 23 }), "L5-23");
});

// Round-trip: every booklet in the curriculum must generate a title that parses
// back to the same booklet. This is the strongest correctness guarantee.
test("round-trip: generate -> parse is identity for ALL math booklets", () => {
  for (const b of curriculum.allMath()) {
    const ref: BookletRef = { subject: "math", level: b.level, booklet: b.position };
    const parsed = parseTitle(generateTitle(ref));
    assert.equal(parsed.subject, "math", `for ${b.code}`);
    assert.equal(parsed.level, b.level, `for ${b.code}`);
    assert.equal(parsed.booklet, b.position, `for ${b.code}`);
  }
});

test("round-trip: generate -> parse is identity for ALL english booklets", () => {
  for (const b of curriculum.allEnglish()) {
    const ref: BookletRef = { subject: "english", level: b.level, booklet: b.position };
    const parsed = parseTitle(generateTitle(ref));
    assert.equal(parsed.subject, "english", `for ${b.code}`);
    assert.equal(parsed.level, b.level, `for ${b.code}`);
    assert.equal(parsed.booklet, b.position, `for ${b.code}`);
  }
});

test("round-trip preserves the hard-copy flag", () => {
  const ref: BookletRef = { subject: "math", level: "12", booklet: 26, hardCopy: true };
  assert.equal(parseTitle(generateTitle(ref)).hardCopy, true);
});
