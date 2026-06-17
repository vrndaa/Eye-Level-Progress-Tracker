// A tiny human-readable walkthrough of the engine. Run with: npm run demo
import { parseTitle } from "./parser.ts";
import { generateTitle } from "./generator.ts";
import { suggestNext, type HistoryItem } from "./position.ts";
import * as curriculum from "./curriculum.ts";

console.log("== Curriculum loaded ==");
console.log(`Math:    ${curriculum.counts.math} booklets across ${curriculum.levels.math.length} levels`);
console.log(`English: ${curriculum.counts.english} booklets across ${curriculum.levels.english.length} levels\n`);

console.log("== Reading messy Classroom titles ==");
for (const t of ["16-2", "12-26 HC", "14 -13 HC", "H7", "L5-23", "extra practice 3a pt 16", "Logic B2-10", "Word Roots Gr3 part 9", "Summer Hours for 2026"]) {
  const p = parseTitle(t);
  console.log(`  "${t}"  ->  ${p.kind}${p.isCurriculumLog ? "" : " (not a log)"}`);
}

console.log("\n== A simulated student session ==");
// Pretend this is what we read back from this student's Classroom (newest first).
const history: HistoryItem[] = [
  { title: "14-14 hc" },
  { title: "14 -13 HC" },
  { title: "H6" },
  { title: "DGP week 12" },
];

const math = suggestNext(history, "math");
console.log(`Math:    last logged ${generateTitle(math.current!)} (${(math.currentMeta as any)?.topic})`);
console.log(`         -> suggest next: ${generateTitle(math.next!)} (${(math.nextMeta as any)?.topic})`);

const eng = suggestNext(history, "english");
console.log(`English: last logged ${generateTitle(eng.current!)} (${(eng.currentMeta as any)?.readingTopic})`);
console.log(`         -> suggest next: ${generateTitle(eng.next!)} (${(eng.nextMeta as any)?.readingTopic})`);

console.log("\nThe teacher would tap to confirm the suggested next booklet, and the app");
console.log("would create a Classroom assignment titled exactly that. (No Google calls here.)");
