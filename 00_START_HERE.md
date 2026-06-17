# Project Handoff — Enopi East Cobb SMILE Digitization

## The Goal
Replace the paper "SMILE Record" with a mobile-first tool that lets teachers log a student's session in under 30 seconds while the student is physically sitting with them — and have that entry land in Google Classroom automatically.

**Non-negotiable constraint:** no matter what gets built, entered data must be reflected on Google Classroom and/or compatible with it.

## Organizational Context
- Enopi East Cobb is a private tutoring center, not a public school.
- Google account confirmed as Google Workspace (managed by enopieastcobb.com).
- Each student has their OWN individual Google Classroom (e.g. "Ava Stone — Gr 4 [2026-2027]") — students are not grouped into shared classes. Multiple teachers post into the same student's Classroom.
- A teacher works with 4 students at a time. Teachers rotate; no teacher "owns" a student.
- An administrator assigns which student goes to which teacher each day — teachers don't self-select.
- Logging happens with the student physically present: roughly a 60–90 second window per student.
- Students may be enrolled in Math only, English only, or both — the app needs to reflect this per student.

## How Logging Currently Works (the system being replaced)
A teacher creates a Google Classroom assignment whose TITLE is the entire log entry. No descriptions, no grades — the Stream is the historical record. Confirmed directly from real Classroom screenshots.

Decoded conventions:
- **HC = Hard Copy** (physical printed booklet) — NOT "Home Completion." Confirmed correction from the user.
- Math format: `[Level]-[Booklet]`, e.g. `12-6`
- English format (Pre-A to I): `[LevelLetter][Number]`, e.g. `H7`
- English format (L5–L8): `[Level][Number]`, e.g. `L5-23`
- "extra practice [code] pt [n]" = supplementary math practice
- "Logic [code]-[n]" = logic/word problem series
- Series titles like "Selection Gr4 Part 6" or "Word Roots Gr3 part 9" — the grade number is the LEVEL of that material, not the student's actual grade
- Posts from "Support staff" / "Administrative Staff" CAN be admin announcements (exam dates, hours) OR real curriculum logs — a screenshot shows Administrative Staff posting `H6` and `12-25 HC`. The TITLE FORMAT, not the author, identifies a curriculum log.
- Wayground (formerly Quizizz) auto-posts online quizzes — separate from booklet logging

## Architecture Decision (locked in)
No separate Google Sheets database. Google Classroom itself is the data store:
- READ: pull a student's past coursework via the Classroom API to show full history before a session starts
- WRITE: when a teacher logs today's work, the app creates a new Classroom coursework item with the correct title format automatically
- The Classroom Stream looks exactly as it does today; nothing changes for anyone just viewing it
- Teachers never open Classroom directly to log anything

## Build Approach (locked in)
- A PWA (Progressive Web App) — not a native app, not a Chrome extension.
- Reasoning: teachers are on mobile phones during class; extensions don't work on mobile; native apps add install friction.
- Teacher adds the PWA to their phone home screen once; after that, no login friction.
- Plan: build a clickable POC first using fake data (no real Google login, no real Classroom API calls) to validate the UX before wiring up real integrations.
- **Status: POC has not been built yet.** We got pulled into curriculum-mapping before circling back to it.

## Curriculum Data Gathered

### Math — high confidence (school-provided file)
- 690 booklets across 23 levels, 30 booklets per level, 8 strands mixed within each level.
- Two parallel tracks per student: Basic Thinking Math (main sequence) + Critical Thinking Math (parallel, runs a few levels behind).
- Source: `math_curriculum.xlsx` (the Eye Level / e·nopi math master).

### English — mixed confidence (sourced online, not yet confirmed against actual school practice)
- Full progression: Pre-A → A → B → C → D → E → F → G → H → I → L5 → L6 → L7 → L8 (14 levels).
- Pre-A through I: 30 booklets each (300 total) — high confidence, transcribed from an official-looking Eye Level curriculum chart.
- L5 through L8: 80 booklets each (320 total) — mixed confidence; several entries flagged `[Verify]` where the source chart was unclear.
- Grade 6+ students also get licensed SAT-prep materials (SAT Vocabulary, SAT Reading, Vocabulary Binder, Divide and Conquer) on top of the standard sequence.
- Two Excel files exist: `english_curriculum_complete.xlsx` is authoritative (built from the real chart). `english_curriculum_reference_v1.xlsx` was built earlier from general knowledge before the real chart arrived — keep only for its Material Series Reference and Classroom Log Decoder sheets, which the other file doesn't have.

## Open Items / Next Steps
1. Verify the `[Verify]`-flagged L5–L8 English topics against a real Grade 5+ student's actual Classroom history.
2. Confirm whether Enopi East Cobb follows the found-online English chart exactly, or deviates from it.
3. User is preparing their own UI concept to share before any interface design begins — Claude was explicitly told not to design UI yet.
4. Build the clickable POC (fake data, no real integrations) once UI direction is set.
5. After POC validation: wire up real Google Sign-In + Classroom API (and Cloud Console setup if needed).

## Key Files
- `math_curriculum.xlsx` — Math curriculum source (school-provided)
- `english_curriculum_complete.xlsx` — Authoritative English curriculum (620 booklets, Pre-A to L8)
- `english_curriculum_reference_v1.xlsx` — Secondary English reference (Material Series Reference, Classroom Log Decoder sheets)
- Google Classroom screenshots — real evidence of current logging behavior
- Original SMILE paper form (blank + filled) — the artifact being replaced
- `ARCHITECTURE.md` — full architecture & build plan (audience: boss + newcomer)
