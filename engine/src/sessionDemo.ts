// A human-readable walkthrough of a full session. Run with: npm run demo:session
import { FakeClassroomSource } from "./fakeClassroom.ts";
import { generateTitle } from "./generator.ts";
import { buildSession, logWork } from "./session.ts";

const source = new FakeClassroomSource();

function showSession(label: string, view: Awaited<ReturnType<typeof buildSession>>) {
  console.log(`\n=== ${label}: ${view.student.name} (${view.student.grade}) ===`);
  for (const t of view.tracks) {
    const s = t.suggestion;
    if (s.noHistory) {
      console.log(`  ${t.label}: no history yet`);
    } else if (s.atEndOfCurriculum) {
      console.log(`  ${t.label}: last ${s.current ? generateTitle(s.current) : "?"} — END of curriculum 🎓`);
    } else {
      const cur = s.current ? generateTitle(s.current) : "?";
      const nxt = s.next ? generateTitle(s.next) : "?";
      const topic = (s.nextMeta as any)?.topic ?? (s.nextMeta as any)?.readingTopic ?? "";
      console.log(`  ${t.label}: last ${cur}  ->  NEXT ${nxt}  ${topic ? `(${topic})` : ""}`);
    }
  }
  if (view.supplementary.length) {
    console.log(`  supplementary: ${view.supplementary.map((p) => p.raw).join(", ")}`);
  }
}

const main = async () => {
  console.log("Students on the roster:");
  for (const st of await source.listStudents()) {
    console.log(`  - ${st.name} (${st.grade}) [${st.tracks.join(", ")}]`);
  }

  // Show a student with both subjects + two math tracks.
  showSession("Open student", await buildSession(source, "ben-carter"));

  // Show end-of-curriculum handling.
  showSession("Open student", await buildSession(source, "zoe-quinn"));

  // Now LOG the suggested next math-basic booklet for Ben, then re-open him.
  console.log("\n>> Teacher 'Ms. Rao' logs Ben's next Basic Thinking Math booklet...");
  const view = await buildSession(source, "ben-carter");
  const basic = view.tracks.find((t) => t.track === "math-basic")!;
  const post = await logWork(source, {
    studentId: "ben-carter",
    track: "math-basic",
    ref: basic.suggestion.next!,
    teacher: "Ms. Rao",
  });
  console.log(`   Wrote Classroom title: "${post.title}"`);
  console.log(`   Hidden metadata:`, JSON.stringify(post.description));

  showSession("Re-opened after logging", await buildSession(source, "ben-carter"));
  console.log("\n(The Basic Thinking suggestion advanced by one — derived live from history.)");
};

main();
