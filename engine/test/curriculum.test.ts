import { test } from "node:test";
import assert from "node:assert/strict";
import * as curriculum from "../src/curriculum.ts";

test("curriculum is fully loaded", () => {
  assert.equal(curriculum.counts.math, 690);
  assert.equal(curriculum.counts.english, 620);
  assert.equal(curriculum.levels.math.length, 23);
  assert.deepEqual(curriculum.levels.english, [
    "Pre-A", "A", "B", "C", "D", "E", "F", "G", "H", "I", "L5", "L6", "L7", "L8",
  ]);
});

test("lookup returns metadata", () => {
  const meta = curriculum.getMeta({ subject: "math", level: "1", booklet: 1 });
  assert.equal(meta?.code, "1-1");
  assert.equal((meta as any).topic, "Writing Numbers");

  const eng = curriculum.getMeta({ subject: "english", level: "Pre-A", booklet: 1 });
  assert.equal(eng?.code, "Pre-A-1");
});

test("exists() distinguishes real booklets from typos", () => {
  assert.equal(curriculum.exists({ subject: "math", level: "23", booklet: 30 }), true);
  assert.equal(curriculum.exists({ subject: "math", level: "23", booklet: 31 }), false);
  assert.equal(curriculum.exists({ subject: "math", level: "24", booklet: 1 }), false);
});

test("the whole sequence is walkable end to end with no gaps", () => {
  let ref = { subject: "math" as const, level: "1", booklet: 1 };
  let n = 1;
  let cur = curriculum.next(ref);
  while (cur) {
    n++;
    cur = curriculum.next(cur);
  }
  assert.equal(n, 690, "should visit every math booklet exactly once");
});

test("isLast marks only the final booklet", () => {
  assert.equal(curriculum.isLast({ subject: "math", level: "23", booklet: 30 }), true);
  assert.equal(curriculum.isLast({ subject: "math", level: "23", booklet: 29 }), false);
  assert.equal(curriculum.isLast({ subject: "english", level: "L8", booklet: 80 }), true);
});
