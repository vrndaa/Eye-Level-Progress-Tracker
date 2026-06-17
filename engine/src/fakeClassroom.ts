// In-memory demo data + a fake ClassroomSource. No Google, no network.
// Students and histories mirror the real Classroom screenshots so the engine is
// exercised against realistic data. postLog() mutates the in-memory history so a
// logged booklet really shows up next time (great for the POC demo loop).

import type { HistoryItem } from "./position.ts";
import type { ClassroomPost, ClassroomSource } from "./source.ts";
import type { Student } from "./types.ts";

interface Seed {
  student: Student;
  history: HistoryItem[]; // newest first
}

// Helper to keep seed data readable.
const h = (title: string, track?: string): HistoryItem => ({ title, track });

const SEEDS: Seed[] = [
  {
    student: { id: "ava-stone", name: "Ava Stone", grade: "Gr 4", tracks: ["math-basic", "math-critical", "english"] },
    history: [
      h("16-2", "basic"),
      h("16-1", "basic"),
      h("11-15", "critical"),
      h("11-14", "critical"),
      h("H5"),
      h("H4"),
      h("extra practice 3a pt 16"),
      h("Word Roots Gr4 part 3"),
    ],
  },
  {
    // Demonstrates the two math tracks interleaved (14-x basic, 12-x critical).
    student: { id: "ben-carter", name: "Ben Carter", grade: "Gr 5", tracks: ["math-basic", "math-critical", "english"] },
    history: [
      h("14-14 hc", "basic"),
      h("14 -13 HC", "basic"),
      h("12-26 HC", "critical"),
      h("12-25 HC", "critical"),
      h("H6"),
    ],
  },
  {
    // Math only.
    student: { id: "maya-lee", name: "Maya Lee", grade: "Gr 3", tracks: ["math-basic", "math-critical"] },
    history: [
      h("12-6", "basic"),
      h("12-5", "basic"),
      h("8-22", "critical"),
      h("8-20", "critical"),
      h("extra practice 16 pt 14"),
      h("Logic A1-8"),
    ],
  },
  {
    // English only, early level.
    student: { id: "noah-park", name: "Noah Park", grade: "Gr 2", tracks: ["english"] },
    history: [h("C5"), h("C4")],
  },
  {
    // Near / at the end of the curriculum — demonstrates the end-of-sequence state.
    student: { id: "zoe-quinn", name: "Zoe Quinn", grade: "Gr 9", tracks: ["math-basic", "english"] },
    history: [h("23-30", "basic"), h("L8-80")],
  },
];

export class FakeClassroomSource implements ClassroomSource {
  private students: Student[];
  private histories = new Map<string, HistoryItem[]>();

  constructor() {
    this.students = SEEDS.map((s) => s.student);
    for (const s of SEEDS) this.histories.set(s.student.id, [...s.history]);
  }

  async listStudents(): Promise<Student[]> {
    return [...this.students];
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.find((s) => s.id === id);
  }

  async getHistory(id: string): Promise<HistoryItem[]> {
    return [...(this.histories.get(id) ?? [])];
  }

  async postLog(post: ClassroomPost): Promise<HistoryItem> {
    const item: HistoryItem = {
      title: post.title,
      createdAt: post.description.loggedAt,
      track: trackTag(post.description.track),
    };
    const list = this.histories.get(post.studentId) ?? [];
    list.unshift(item); // newest first
    this.histories.set(post.studentId, list);
    return item;
  }
}

// Local copy of the track -> tag mapping to avoid importing tracks.ts here.
function trackTag(track: ClassroomPost["description"]["track"]): string | undefined {
  if (track === "math-basic") return "basic";
  if (track === "math-critical") return "critical";
  return undefined;
}
