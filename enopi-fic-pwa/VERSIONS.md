# Version history — Enopi Progress Tracker (PWA)

A plain-English log of each version. **Every version below is also a git tag/release** —
on GitHub, open **Releases** (or the tag) to view or download that exact snapshot of the app.

To see a version's code on GitHub:
`https://github.com/vrndaa/Eye-Level-Progress-Tracker/tree/<tag>` (e.g. `.../tree/v3`).

---

## v4 — Student progress lookup · 2026-07-09 · _current_
The **pivot**, built after director/teacher feedback on v3. A read-only, **student-centric**
tool:
- **Search** any student (handles make-ups & walk-ins, not just the scheduled slot)
- **Student progress** screen: work grouped by subject → topic (Classwork / To Be Graded /
  Homework / Graded), each item color-coded **per item** — 🟢 done · 🟠 FIC · 🔴 not done
- Shows **Assigned** (Classroom coursework) vs **Given** (physical notebook), and FIC fix-by dates
- Runs on mock Classroom-shaped data; no assigning (that stays in Classroom)

Tag `v4` · commit `c8967bd`

## v3 — Google Sheets write-back · 2026-07-04
**First concept shown to the director.** The session-based tool (teacher → time slot → student
→ FICs) with a live Google Sheets connection: clearing a FIC wrote **Cleared / date / teacher**
back to the sheet. Feedback on this version drove the v4 pivot (make it a read-only,
student-centric *progress* view instead of a session clearing tool).

Tag `v3` · commit `3110765`

## v2 — Real data from the Excel sheet · 2026-07-04
Same session UI as v1, but fed by the real **`FIC_Registry_POC_data.xlsx`** (converted into
`registry.json` by `scripts/build-registry.py`) instead of fake sample data.

Tag `v2` · commit `cf9dbf7`

## v1 — Initial PWA scaffold · 2026-07-04
First working app on fake/mock data. Session view: pick teacher → time slot → see students and
their FICs, with a Clear/Undo toggle. Stack: Vite · React · Tailwind v4 · vite-plugin-pwa.

Tag `v1` · commit `aac52ad`

---

### How versions are tracked (for future changes)
We use **git tags**, not duplicate folders. Each meaningful version gets a tag (`v5`, `v6`, …)
and an entry above. This keeps one clean copy of the app while preserving every version's exact
code, browsable and downloadable on GitHub.
