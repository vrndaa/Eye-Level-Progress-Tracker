# CLAUDE.md — Enopi FIC Registry PWA

## What this is
A mobile-first PWA that lets teachers **search any student and see their full progress**
at a glance — what's assigned, what's a FIC (Fix-In-Class), what's done — pulled from Google
Classroom. Built for Enopi East Cobb (Eye Level / e·nopi supplementary tutoring).
**Read-only lookup tool** (no assigning — that stays in Classroom).

## Status — POC on mock data (director demo)
Pivoted (per teacher/director feedback) from a session-based "clear the FICs" tool to a
**student-centric, read-only progress lookup**. Currently runs on **mock Classroom data**
(`src/data/mockClassroom.js`) — no accounts, no network. Going live = swap the two data-source
functions for Google Classroom API calls; the UI won't change.

Two screens:
- **Home:** search box + student list (name, grade, FIC / Not-done counts). Search handles
  make-ups & walk-ins — you find *anyone*, not just the scheduled slot.
- **Student progress:** summary strip (done / FIC / not-done) + work grouped by subject → topic
  (Classwork / To Be Graded / Homework / Graded), each item color-coded with dates, the
  **Assigned** material and the **Given** notebook.

Stack: Vite · React · Tailwind v4 · vite-plugin-pwa · lucide-react.

## Run
```bash
npm install
npm run dev      # build: npm run build
```

## Architecture — the one seam that matters
All data flows through **`src/data/dataSource.js`**. The UI (`App.jsx`) only knows this contract:

- `getStudents() -> Promise<Student[]>`
  `Student = { id, name, grade, counts: { done, fic, notdone } }`
- `getStudentProgress(id) -> Promise<Progress | null>`
  `Progress = { id, name, grade, counts, items: Item[] }`
  `Item = { id, subject, topic, title, status, posted, due, fixBy, material, given }`

Key fields: `status` = `'done' | 'fic' | 'notdone'` (green / orange / red, **per item**).
`material` = the **assigned** Classroom coursework; `given` = the **physical notebook**
(recorded in the assignment header). FIC = an item returned to Classwork with a `fixBy` date.

## Next tasks (in order)
1. Show the director the POC (mock data); gather feedback on the two screens.
2. Wire the real Google Classroom API behind `dataSource.js` (courses = students; coursework +
   submission state → items). Read-only scopes.
3. Layer Vrnda's visual design over the plain scaffold.
4. (Parked) optional lightweight "mark as done".

## Legacy (superseded by the pivot)
`mockData.js`, `registry.json`, `build-registry.py`, `sheets.js`, `googleConfig.js`,
`SETUP_GOOGLE_SHEETS.md` and the FIC-Registry-sheet approach belong to the earlier
session/Sheets design. Kept for reference; not used by the current app. The Google **Sheets**
write-back is abandoned — the real source is **Classroom**.

## Blocker (data, not code)
The roster (Weekly Class Schedule sheet) and the FICs (grader's list) have **no shared student
key** — they're joined **by hand** right now (schedule "Shrey P" vs grader "Shrey Patel"). A shared
student ID is required before the join can be automated. In-app, amber notes flag hand-matches and
unmatched students show "no FICs logged".

## Key design direction
The risk this phase must avoid: becoming a **second interface** teachers use alongside Classroom.
It only nets positive if it's a **glance, not a data-entry job**:
- Clearing is lightweight — no re-typing.
- Each FIC **deep-links to its exact Classroom item**, so the actionable detail ("work Q15") is one
  tap away, not a hunt. Whether the grader types `detail` or it's read/linked from Classroom is an
  **open director decision**.

## Fixed decisions — do NOT reopen
- **Google Classroom is the system of record** (director resolved). Don't propose a Google Sheet as
  an alternative source of truth for assignment *content*. The FIC Registry sheet holds FIC *state*
  (outstanding / cleared / ready), which Classroom doesn't track. **State here, content in Classroom
  — they reference, never duplicate.**
- The registry **replaces** the grader's daily FIC message to the director — not an additional place to update.
- The **SMILE paper sheet is deprecated** — not an active artifact. (Ignore the legacy repo name.)
- **Two separate problems:** visibility (this phase) vs assignment friction (later). Don't merge them.

## Out of scope this phase
- **Assign-next / one-gesture logging.** Blocked: the Classroom API can only publish coursework
  created within its own OAuth project, so the drafter's GC-drafted assignments can't be published by
  the PWA's project until drafting migrates into it.
- **Real Math FIC data** — the grader's list so far is English only.

## Conventions
- **Don't invent domain terminology or codes.** Use exactly what the grader/curriculum use.
  English strand codes seen: RS, RW, DGP, CS, PR, PF, NS, SR, SV, GRAMMAR, READING.
  Math workbooks come from the Eye Level curriculum (e.g. `Algebra 3-2`).
- **Visual/interface design is owned by Vrnda** — build functionality, keep styling minimal unless she directs otherwise.
- Keep the `dataSource` seam clean — no API calls or data shaping leaking into components.

## Repo
Lives in the existing private repo `https://github.com/vrndaa/enopi-smile-project.git`
(this app in its own subfolder). Push workflow:
```bash
git add <folder> && git commit -m "..." && git push
```
`node_modules/` and `dist/` are gitignored.
