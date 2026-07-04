# CLAUDE.md — Enopi FIC Registry PWA

## What this is
A mobile-first PWA that gives teachers a **glanceable, per-session view of student FICs**
(Fix-In-Class items) so they know who needs what at session start — instead of hunting
through Google Classroom. Built for Enopi East Cobb (Eye Level / e·nopi supplementary
tutoring). This is the **visibility layer (phase 1)**.

## Status
Working model on **fake data** — runs fully offline (no Classroom, no API, no accounts).
Stack: Vite · React · Tailwind v4 · vite-plugin-pwa · lucide-react.

## Run
```bash
npm install
npm run dev      # build: npm run build
```

## Architecture — the one seam that matters
All data flows through **`src/data/dataSource.js`**. The UI (`App.jsx`) only knows this contract:

- `getSessions() -> Promise<Session[]>`  — `Session = { teacher, slot, students }`
- `clearFic(ficId, cleared) -> Promise<void>` — **UPDATE** the registry row
  (Status Outstanding⇄Cleared + Cleared Date + Teacher). **Never delete — the row is the record.**

Today both functions read/return mock data from `mockData.js`. **Going live = replace those two
function bodies with Google Sheets API calls. The UI must not change.**

Data shapes:
- `Student = { id, name, grade, note, unmatched, fics }`
- `Fic = { id, program, code, detail, cleared }`  (`detail` = the FIC-level detail, e.g. "Q15")

## Next tasks (in order)
1. Confirm the data blocker (below) with director/drafter **before** wiring live data.
2. Implement `getSessions()` — read the FIC Registry sheet via Sheets API.
3. Implement `clearFic()` — single-row update (Status / Cleared Date / Teacher).
4. Deep-link each FIC to its exact Classroom assignment (see design direction).
5. Layer Vrnda's visual design over the plain scaffold.

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
