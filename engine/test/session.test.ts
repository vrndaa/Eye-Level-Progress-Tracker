import { test } from "node:test";
import assert from "node:assert/strict";
import { FakeClassroomSource } from "../src/fakeClassroom.ts";
import { buildSession, logWork, logSuggestedNext } from "../src/session.ts";
import { enrolledSubjects } from "../src/tracks.ts";

test("roster lists the demo students", async () => {
  const source = new FakeClassroomSource();
  const students = await source.listStudents();
  assert.ok(students.length >= 5);
  assert.ok(students.some((s) => s.name === "Ben Carter"));
});

test("buildSession produces a per-track current/next view", async () => {
  const source = new FakeClassroomSource();
  const view = await buildSession(source, "ben-carter");

  assert.equal(view.student.name, "Ben Carter");
  assert.deepEqual(enrolledSubjects(view.student), ["math", "english"]);

  const basic = view.tracks.find((t) => t.track === "math-basic")!;
  assert.equal(basic.suggestion.current?.level, "14");
  assert.equal(basic.suggestion.current?.booklet, 14);
  assert.equal(basic.suggestion.next?.booklet, 15);

  const critical = view.tracks.find((t) => t.track === "math-critical")!;
  // The critical track must NOT pick up the 14-x basic entries.
  assert.equal(critical.suggestion.current?.level, "12");
  assert.equal(critical.suggestion.current?.booklet, 26);
  assert.equal(critical.suggestion.next?.booklet, 27);

  const english = view.tracks.find((t) => t.track === "english")!;
  assert.equal(english.suggestion.current?.level, "H");
  assert.equal(english.suggestion.next?.booklet, 7); // H6 -> H7
});

test("end-of-curriculum is surfaced per track", async () => {
  const source = new FakeClassroomSource();
  const view = await buildSession(source, "zoe-quinn");
  const basic = view.tracks.find((t) => t.track === "math-basic")!;
  assert.equal(basic.suggestion.atEndOfCurriculum, true);
  const english = view.tracks.find((t) => t.track === "english")!;
  assert.equal(english.suggestion.atEndOfCurriculum, true);
});

test("supplementary work is collected separately from main tracks", async () => {
  const source = new FakeClassroomSource();
  const view = await buildSession(source, "ava-stone");
  const kinds = view.supplementary.map((p) => p.kind).sort();
  assert.deepEqual(kinds, ["extra-practice", "series"]);
});

test("logWork builds the right title + metadata and persists it", async () => {
  const source = new FakeClassroomSource();
  const before = await buildSession(source, "ben-carter");
  const next = before.tracks.find((t) => t.track === "math-basic")!.suggestion.next!;

  const post = await logWork(source, {
    studentId: "ben-carter",
    track: "math-basic",
    ref: next,
    teacher: "Ms. Rao",
  });

  assert.equal(post.title, "14-15");
  assert.equal(post.description.teacher, "Ms. Rao");
  assert.equal(post.description.track, "math-basic");
  assert.equal(post.description.level, "14");
  assert.equal(post.description.booklet, 15);

  // Re-opening reflects the write: the suggestion advances.
  const after = await buildSession(source, "ben-carter");
  const basic = after.tracks.find((t) => t.track === "math-basic")!;
  assert.equal(basic.suggestion.current?.booklet, 15);
  assert.equal(basic.suggestion.next?.booklet, 16);
});

test("logWork rejects a ref whose subject doesn't match the track", async () => {
  const source = new FakeClassroomSource();
  await assert.rejects(
    logWork(source, {
      studentId: "ben-carter",
      track: "english",
      ref: { subject: "math", level: "5", booklet: 1 },
      teacher: "Ms. Rao",
    }),
    /english.*math/,
  );
});

test("logSuggestedNext logs whatever the track suggests", async () => {
  const source = new FakeClassroomSource();
  const post = await logSuggestedNext(source, "noah-park", "english", "Mr. Diaz");
  assert.equal(post?.title, "C6"); // C5 -> C6
});

test("hard-copy preserves the HC suffix end to end", async () => {
  const source = new FakeClassroomSource();
  const post = await logWork(source, {
    studentId: "ben-carter",
    track: "math-critical",
    ref: { subject: "math", level: "12", booklet: 27, hardCopy: true },
    teacher: "Ms. Rao",
  });
  assert.equal(post.title, "12-27 HC");
  assert.equal(post.description.hardCopy, true);
});
