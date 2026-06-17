import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestNext, type HistoryItem } from "../src/position.ts";

test("suggests the next math booklet from the most recent history entry", () => {
  // Newest first, as the Classroom Stream shows.
  const history: HistoryItem[] = [
    { title: "16-2" },
    { title: "16-1" },
    { title: "extra practice 3a pt 16" },
  ];
  const s = suggestNext(history, "math");
  assert.equal(s.noHistory, false);
  assert.equal(s.current?.level, "16");
  assert.equal(s.current?.booklet, 2);
  assert.equal(s.next?.level, "16");
  assert.equal(s.next?.booklet, 3);
  assert.equal(s.atEndOfCurriculum, false);
});

test("advances across a level boundary (X-30 -> next level -1)", () => {
  const s = suggestNext([{ title: "1-30" }], "math");
  assert.equal(s.next?.level, "2");
  assert.equal(s.next?.booklet, 1);
});

test("english boundary respects variable level sizes (I-30 -> L5-1)", () => {
  const s = suggestNext([{ title: "I30" }], "english");
  assert.equal(s.current?.level, "I");
  assert.equal(s.next?.level, "L5");
  assert.equal(s.next?.booklet, 1);
});

test("detects end of the whole curriculum", () => {
  const math = suggestNext([{ title: "23-30" }], "math");
  assert.equal(math.atEndOfCurriculum, true);
  assert.equal(math.next, undefined);

  const eng = suggestNext([{ title: "L8-80" }], "english");
  assert.equal(eng.atEndOfCurriculum, true);
});

test("ignores non-booklet noise and other subjects when picking current", () => {
  const history: HistoryItem[] = [
    { title: "DGP week 12" }, // english grammar, newest — ignored for math
    { title: "Summer Hours for 2026" }, // announcement
    { title: "H7" }, // english booklet
    { title: "8-19" }, // the latest MATH booklet
  ];
  const math = suggestNext(history, "math");
  assert.equal(math.current?.level, "8");
  assert.equal(math.current?.booklet, 19);
  assert.equal(math.next?.booklet, 20);

  const eng = suggestNext(history, "english");
  assert.equal(eng.current?.level, "H");
  assert.equal(eng.next?.booklet, 8);
});

test("no history yields a noHistory suggestion, not a crash", () => {
  const s = suggestNext([{ title: "Summer Hours for 2026" }], "math");
  assert.equal(s.noHistory, true);
  assert.equal(s.current, undefined);
  assert.equal(s.next, undefined);
});

test("ignores titles that look like booklets but aren't in the curriculum", () => {
  // 99-99 parses structurally but is not a real booklet.
  const s = suggestNext([{ title: "99-99" }, { title: "5-4" }], "math");
  assert.equal(s.current?.level, "5");
  assert.equal(s.current?.booklet, 4);
});

test("orders by createdAt when timestamps are present", () => {
  const history: HistoryItem[] = [
    { title: "8-1", createdAt: "2026-05-01" },
    { title: "8-5", createdAt: "2026-06-01" }, // most recent
    { title: "8-3", createdAt: "2026-05-15" },
  ];
  const s = suggestNext(history, "math");
  assert.equal(s.current?.booklet, 5);
  assert.equal(s.next?.booklet, 6);
});

test("track filter disambiguates the two math tracks", () => {
  const history: HistoryItem[] = [
    { title: "12-6", track: "basic" }, // basic thinking, ahead
    { title: "8-22", track: "critical" }, // critical thinking, behind
  ];
  const basic = suggestNext(history, "math", { track: "basic" });
  assert.equal(basic.current?.level, "12");
  assert.equal(basic.next?.booklet, 7);

  const critical = suggestNext(history, "math", { track: "critical" });
  assert.equal(critical.current?.level, "8");
  assert.equal(critical.current?.booklet, 22);
});
