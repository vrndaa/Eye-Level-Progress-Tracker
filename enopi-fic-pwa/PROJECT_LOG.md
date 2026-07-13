# Enopi Progress Tracker — Project Log & Design Decisions

_A running reference of what we've built, the feedback, the open questions, and what's feasible._
_Status as of 2026-07-13: **Classroom API feasibility CONFIRMED** via a working spike, and realistic
test data now lives in real Google Classroom (4 fake student classes). Next: wire the app to read it._

> **Screenshots:** add yours where you see `📸 [screenshot: …]`. Drop the images in a
> `docs/screenshots/` folder and link them, or just paste them into your own copy of this doc.

---

## 1. What we're building (the goal)

A mobile/tablet tool that lets tutoring teachers **look up any student and instantly see their
learning progress** — what's assigned, what's a FIC (Fix-In-Class), what's done — instead of
digging through Google Classroom student-by-student.

- **Read-only.** No assigning, no data entry — assigning stays in Google Classroom.
- Built for **Enopi East Cobb** (Eye Level / e·nopi supplementary tutoring).
- Works on **phone and tablet**, whichever the teacher is comfortable with.

---

## 2. Where it lives

- **GitHub repo:** https://github.com/vrndaa/Eye-Level-Progress-Tracker (app is in the `enopi-fic-pwa/` folder)
- **Versions tagged:** v1–v4 (see `VERSIONS.md`) — each is a browsable snapshot on GitHub
- **Live (older v4 build):** deployed on Vercel (student-search version). The newer room-based
  flow currently lives as an **interactive prototype inside the working session**, not yet deployed.

---

## 3. The journey (versions)

| Version | What it was |
|---|---|
| **v1** | First working app on fake data — session view (teacher → time slot → students → FICs with a Clear button) |
| **v2** | Same UI, fed by the real `FIC_Registry_POC_data.xlsx` |
| **v3** | Added live Google **Sheets** read/write (clearing a FIC wrote back to the sheet) — **first concept shown to the director** |
| **v4** | **The pivot** → read-only, student-search progress lookup (deployed to Vercel) |
| **(current prototype)** | Room-based flow: English/Maths room → teacher → slot → student → horizontal SMILE-style progress popup. Phone + tablet. Fake data. |

📸 [screenshot: v3 session view — the first concept]
📸 [screenshot: v4 student-search version (Vercel)]
📸 [screenshot: current prototype — room flow, phone + tablet]
📸 [screenshot: current prototype — SMILE progress popup]

---

## 4. The pivot — what changed and why

After showing the first concept, teacher/director feedback moved us from a **session-based
"clear the FICs" tool** to a **read-only, student-centric progress lookup**. Reasons:

- The schedule is often not followed (students come late, swap, do make-ups/walk-ins).
- Teachers need a **full progress picture**, not just outstanding FICs.
- Assigning things through the tool would over-complicate it — keep it read-only.
- Need clear **done / FIC / not-done** status, and a **given-vs-assigned** distinction.

---

## 5. Current design & flow

**One screen, top to bottom:**
1. **Room toggle** — `English room` · `Maths room` (both visible)
2. **Teacher toggle** — Ms. Haiku · Ms. Jai (tap yours → see your students)
3. **Time slots** — 3:00 / 4:00 / 5:00 / 6:00
4. **Search bar** — only for walk-ins / make-ups not on the list
5. **Student list** — each row: dropdown chevron + name + grade + **"View progress"** button

**Two ways into a student:**
- **Chevron (dropdown)** → quick inline peek
- **"View progress"** → popup with the **horizontal SMILE-style grid** (rows = session dates,
  columns = curriculum strands, colored dots = done/FIC/not-done)

**Room = subject:** the English-room popup shows English strands; Maths-room shows Math strands.

📸 [screenshot: room toggle + teacher + slots + student list]
📸 [screenshot: student dropdown (inline peek)]
📸 [screenshot: SMILE progress popup — Maths]
📸 [screenshot: SMILE progress popup — English]

---

## 6. Feedback received (latest round)

1. **Status categorization is unclear.** How do we decide what's done / not-done / FIC, using the
   Google Classroom sections (Classwork / Homework / To Be Graded / Graded)?
2. **The student dropdown should show only what's outstanding** — not-done items + FICs, *not*
   what's already done. And it should be a clean **list**, not little squares/chips. Read-only,
   no Clear button (that was from the old version).
3. **The "View progress" popup is overwhelming** — 6+ columns is a lot; if teachers are already
   overwhelmed by Classroom, a wide grid doesn't help. Need a calmer way to show deep progress.

---

## 7. Questions raised (and answers)

**Q1 — What's the reasoning behind done / FIC / not-done, and which Classroom section does each pull from?**
Proposed mapping (drives the colors):

| Status | Color | Source in Classroom |
|---|---|---|
| Not done | 🔴 | In Classwork/Homework, student hasn't turned it in |
| To be graded *(proposed new state)* | 🔵 | Turned in, sitting in "To Be Graded", grader hasn't reviewed |
| FIC (fix in class) | 🟠 | Returned to Classwork with a fix-by date (`… .fic Jul1`) |
| Done | 🟢 | In "Graded" — grader finished, nothing to fix |

Recommendation: drive status mainly off the **topic/section movement** (matches how graders
physically move work), with the `.fic` date shown as detail.

**Q2 — What's the backend logic, and is this actually possible?**
Plain-English version (also the "how to explain it" script):
> Google Classroom already holds every assignment, its section, each student's status, grades and
> dates. Our app signs in with a teacher's Google account (read-only permission), asks Google
> Classroom's official API for that data, and translates it into the simple red/orange/green view.
> We store nothing — it reads live from Classroom. The one extra piece is the director's schedule
> (who's in which room/slot), read from her sheet and matched to each student.

Two data sources: **Classroom** (progress) + **director's schedule** (who's where), joined by student.

---

## 8. Decisions locked

- Read-only tool — no assigning, no data entry.
- Student-centric; search exists but only as a fallback for walk-ins.
- Room = subject (English room shows English, Maths room shows Math).
- Progress popup uses the **horizontal SMILE record format** (rows = dates, columns = strands),
  first column = **date only** (teacher name removed).
- Google **Classroom** is the real data source. The earlier Google **Sheets** write-back is abandoned.
- Works on phone and tablet.

---

## 9. Open decisions (need input / to design)

- [ ] **4th status "To be graded" (🔵)?** Show it, or fold into done/not-done?
- [ ] **Official FIC signal** — topic movement vs. the `.fic` title marker (recommend topic + show date).
- [ ] **English-room strand columns** — confirm the set (currently RS, RW, DGP, CS, Grammar,
      Extra practice).
- [ ] **Calmer progress view** — pick a direction (see below).
- [ ] **Director's schedule sync** — how the roster gets from her Excel into the app (later).

---

## 10. Ideas to reduce popup overwhelm (feedback #3)

- **A — "What matters now" list** _(recommended)_: popup opens on a calm vertical list of just the
  outstanding FICs + not-done items + current level per active strand. No grid, no side-scroll.
- **B — Progressive disclosure**: open on the simple summary, with a "See full history" toggle that
  reveals the full date×strand grid only if wanted.
- **C — Hide empty strands**: keep the grid but only show columns the student actually has activity in.

Recommendation: **A as default + B's toggle** for the deep grid.

---

## 11. Feasibility — CONFIRMED (2026-07-13)

Ran a read-only spike (`spike/classroom-spike.mjs`) against a real Google Classroom on a personal
Gmail. **The API returns everything we need**, including assignments **made by hand in the Classroom
website** (the one risk we flagged). Confirmed working:
- ✅ Lists classes, reads topics (Classwork / Homework / To Be Graded / Graded)
- ✅ Reads assignments made by hand in the UI (the key uncertainty — now cleared)
- ✅ FIC detection from the `.fic` title marker
- ✅ Reads per-student submission state (the raw material for done/not-done/FIC)

**Test data:** `spike/setup-test-classrooms.mjs` filled 4 fake student classes (Aarav Mehta Gr3,
Priya Nair Gr5, Ishaan Rao Gr7, Maya Krishnan Gr4) with 6 topics + ~27 assignments (6 FICs). Run
with `--delete` to clear it.

Known real-world notes (not blockers): personal Gmail can't *create/delete* classes via API (only
read/write coursework), so shells are made by hand; a **Web** OAuth client is needed for the browser
app (the spike used a Desktop client); Google app-verification applies only beyond a few pilot users.

---

## 12. Next steps (in order)

1. **See real data in the app** — pull the 4 test classrooms into a data file and point the app at it,
   so real Classroom data shows in the app's screens (locally). Reuses the auth already granted.
2. **Rebuild the screens** into the room → teacher → student → SMILE-popup design we prototyped.
3. **Go live in the browser** — Web OAuth client + in-app Classroom fetch; redeploy to Vercel.
4. **Director's schedule sync** — how the roster (who's in which room/slot) feeds the app.
