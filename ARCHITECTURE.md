# Architecture & Build Plan — Enopi East Cobb Session Logger

*Status: planning / pre-build. No application code written yet.*
*Last updated: 2026-06-17*

---

## Part 1 — Executive Summary (for a quick read)

**The problem.** Teachers at Enopi East Cobb log every student's work by hand. Today
that means opening Google Classroom mid-session and creating an assignment whose
*title* is the whole log entry (e.g. `16-2`, `12-26 HC`, `H7`). It's slow, easy to
get wrong, and happens while a student is sitting right there with a 60–90 second
window.

**The goal.** A phone-friendly tool that lets a teacher log a student's session in
**under 30 seconds**, and have that entry land in **Google Classroom automatically** —
so nothing changes for anyone who just views the Classroom Stream.

**The approach.** A **PWA** (a website that installs onto a phone's home screen like
an app). The teacher taps their student, the app shows that student's history and
**pre-selects the next booklet** in the sequence, the teacher confirms, and the app
writes a correctly-formatted entry into that student's Google Classroom.

**Why it's feasible.** Two facts we verified against Google's documentation:
1. The Classroom API lets our app **read all of a student's history** and **create new
   entries**. Entries our app creates, only our app can edit — so we can never damage
   the existing record. (We only ever *add*, never overwrite.)
2. Because Enopi is a Google Workspace organization, the center's owner can approve our
   app **internally** — we skip Google's months-long public app-review process.

**What's covered.** Both **Math and English** in one tool (students may take either or
both). The original paper form ("SMILE Record") was math-only; the digital tool unifies
both subjects.

---

## Part 2 — How We're Going to Build This (plain-English, for the newcomer)

This section assumes no technical background. Each piece is explained with a everyday
analogy, then named so you can recognize it later.

### The big idea: Google Classroom *is* the database

Normally an app stores its data in its own database. We are deliberately **not** doing
that. Instead, **Google Classroom itself is the filing cabinet.** Every log entry is
already a Classroom assignment, and that's where it stays.

Why? Because the center already trusts Classroom, parents already see it, and we
promised nothing would change for people just viewing it. Adding a *second* database
would mean two sources of truth that can drift apart. One filing cabinet is safer.

The consequence: **the app never "remembers" where a student is.** Every time a teacher
opens a student, the app *reads the Classroom history, figures out the latest entry, and
calculates what comes next.* Think of it like a bookmark you re-derive by flipping to
the last written page, rather than a number you wrote on a sticky note.

### The five building blocks

Imagine the app as five Lego pieces that snap together:

**1. The Curriculum Map (the "what comes next" rulebook).**
We already have the full sequences in spreadsheets — Math (690 booklets across two
tracks) and English (Pre-A through L8 plus the extra series like Word Roots, SAT
Vocab, etc.). We convert those spreadsheets into a file the app carries inside itself.
*Analogy: the textbook's table of contents, built into the app so it always knows what
chapter follows which.*

**2. The Translator (reading old entries).**
Classroom entries are messy free text typed by humans: `14-14 hc`, `14 -13 HC`,
`12-26 HC` all mean similar things with different spacing and capitalization. The
Translator reads that mess and turns it into clean, structured information ("Math,
Level 14, Booklet 13, Hard Copy"). *Analogy: a person who can read sloppy handwriting
and tell you exactly what it says.* **This is the trickiest, most important part of the
whole app**, so we build and test it first, in isolation, against the real screenshots.

**3. The Scribe (writing new entries).**
The reverse of the Translator. The teacher picks "Math, Level 14, Booklet 14" and the
Scribe produces the exact title text Classroom expects (`14-14`), matching the center's
existing conventions so the Stream looks unchanged.

**4. The App Face (the PWA the teacher taps).**
The actual screens on the phone. *We are intentionally not designing this yet* — you're
preparing your own interface concept first. When we do, it'll be built to work even on
shaky Wi-Fi: if the connection drops mid-session, the entry is saved and sent the
moment the phone reconnects, so a teacher's tap is never lost.

**5. The Messenger (the small backend that talks to Google).**
A tiny program running on a server whose only job is to safely talk to Google
Classroom on the app's behalf. We need this because of a security rule (explained
next). *Analogy: a trusted front-desk clerk who holds the master key; teachers ask the
clerk, the clerk opens the cabinet — nobody hands the master key to a phone.*

### Why we need "the Messenger" (the backend)

The center uses **one shared teacher login** for Classroom (the screenshots show posts
by a generic "teacher account"). To act as that shared account, the app needs a secret
credential. **You can never put a secret credential inside a phone app** — anyone could
extract it. So the secret lives on the server (the Messenger), and phones talk to the
Messenger instead of to Google directly.

The owner of the center (who controls the Google Workspace admin settings) approves
this once, using a Google feature called **domain-wide delegation** — essentially the
owner saying "I trust this app to act as our teacher account for Classroom, and nothing
else." After that one-time approval, it just works.

### One clever trick: keeping track of *which* teacher logged what

The paper form records the teacher's name, but the shared Google login can't tell
teachers apart. Our solution: the app asks the teacher who they are at the start of a
session, and we tuck that information (plus a timestamp and the structured details)
into the **invisible "description" field** of each Classroom entry. The visible title
stays exactly as it looks today; the extra detail rides along underneath, unseen in the
Stream but available to the app. *Analogy: a title on the spine of a book, with a small
index card tucked inside the cover for our own records.*

---

## Part 3 — Technical Architecture

### Core principle: derived state, not stored state

There is no application database for student progress. A student's "current position"
is computed at read-time by listing their Classroom coursework, parsing the most recent
relevant titles, and looking up the next item in the bundled curriculum sequence.

### Components

| Layer | Responsibility | Notes |
|---|---|---|
| **Curriculum data** (static, bundled) | Math (Basic Thinking + Critical Thinking tracks) and English (main sequence + supplementary series) | Generated from the three source spreadsheets into app-readable JSON. The "what comes next" source of truth. |
| **Title Parser** (read) | Messy legacy title → structured object `{subject, track/series, level, booklet, hc, raw}` | Highest-risk component. Must tolerate inconsistent spacing/case. Tested against the real Classroom screenshots before anything else is built. |
| **Title Generator** (write) | Structured selection → canonical title string | Round-trips with the Parser; preserves the center's existing title conventions. |
| **Position engine** | Latest parsed log + curriculum sequence → next-item suggestion | Powers the one-tap "log the next booklet" flow. |
| **PWA client** (offline-first) | Teacher-facing screens; service worker caches curriculum + history; outbound write queue syncs on reconnect | UI design deferred per project constraint. |
| **Backend ("Messenger")** | Holds the service-account credential; performs Classroom reads/writes; serves the daily roster | Required because of the shared-login model (see Auth). |
| **Daily roster store** | Records the admin's daily student → teacher assignment | The one piece of state Classroom cannot represent natively. |

### Authentication & authorization

- **Model:** single shared teacher account, used by all teachers.
- **Mechanism:** a Google Cloud **service account with domain-wide delegation**,
  impersonating the shared teacher account, authorized once by the center's super admin
  (the center owner).
- **Credential location:** server-side only (never shipped to the client).
- **Verification:** as an internal Workspace app, sensitive Classroom scopes do **not**
  require Google's public app-review process.
- **Scopes (minimal):** Classroom coursework read + create for the courses the shared
  account teaches.

### Data flow for one logging session

1. Teacher opens the PWA, identifies themselves (picker/PIN), selects a student.
2. PWA asks the backend for that student's recent coursework.
3. Backend reads the student's Classroom course; returns the items.
4. PWA runs the Parser on the history, the Position engine suggests the next booklet(s)
   per subject the student is enrolled in.
5. Teacher confirms or adjusts; taps log.
6. PWA sends the structured entry to the backend (queued locally if offline).
7. Backend uses the Generator to build the canonical title, writes a new coursework
   item (title = visible log; description = structured JSON metadata incl. teacher).
8. The Classroom Stream now shows the new entry, identical in appearance to today's.

### Write-safety guarantee

The Classroom API restricts edit/delete of a coursework item to the same Cloud project
that created it. Our app **only ever creates new items** and never edits human-made
historical entries — so the existing record cannot be corrupted by the app.

---

## Part 4 — Key Decisions (locked in)

| Decision | Choice | Why |
|---|---|---|
| Data store | Google Classroom itself (no separate DB) | Single source of truth; Stream stays unchanged; non-negotiable Classroom compatibility |
| App type | PWA (installable website) | Teachers are on phones; browser extensions don't work on mobile; native apps add install friction |
| Subject scope | Math **and** English, unified | Students enroll in either or both |
| Login model | One shared teacher account | Matches current center practice |
| Auth | Service account + domain-wide delegation, server-side | Required by shared login; avoids public Google review (internal Workspace app) |
| Teacher attribution | Stored in the coursework description field | Preserves the paper form's Teacher column without changing the visible title |
| First build target | The non-visual engine (curriculum + parser + generator + position) | Highest risk, needs no UI decisions and no Google access |

---

## Part 5 — Build Roadmap (phased)

**Phase 0 — Data engine (no UI, no Google).**
Convert the spreadsheets to curriculum JSON. Build and test the Parser, Generator, and
Position engine against the real screenshot titles. *Deliverable: a proven "what comes
next" engine.* ← recommended starting point.

**Phase 1 — Clickable POC with fake data.**
Wire the engine into a clickable prototype using made-up students (no real Google
login, no real Classroom calls) to validate the teacher flow. *Gated on your UI
concept.*

**Phase 2 — Real Google integration.**
Set up the Google Cloud project, get the center owner to authorize the app (domain-wide
delegation), connect read + write against real Classroom data.

**Phase 3 — Pilot.**
A few teachers use it live alongside the paper form; fix what the real 60–90 second
window exposes; then retire the paper form.

---

## Part 6 — Risks & Open Dependencies

1. **Owner authorization** — live Classroom access requires the center owner (super
   admin) to approve the app. Human gate before Phase 2. Get it on their radar early.
2. **Daily roster has no home in Classroom** — needs a small dedicated store, or
   teachers self-select their 4 students each day. Decision pending.
3. **English L5–L8 data is unverified** — several `[Verify]` flags in the source.
   Fine for the POC; must be confirmed against a real Grade 5+ student before live use.
4. **Legacy title messiness** — the Parser is the riskiest code. The description-JSON
   trick limits this risk to *historical* entries only (the app reads its own entries
   from clean JSON).
5. **UI is intentionally deferred** — interface design waits on your concept.

---

## Part 7 — What to Call It

The center already knows the paper form as the **"SMILE Record"** (Supplementary Math
Individualized Learning Experience). Teachers recognize the word — that familiarity is
worth keeping, but the original acronym is *math-only* and our tool now covers English
too. A few directions:

| Name | Rationale |
|---|---|
| **SMILE** (re-defined as *Student Multi-subject Individualized Learning Experience*) — **recommended** | Keeps the name everyone already knows; quietly broadens the acronym from "Math" to "Multi-subject" so it honestly covers English too. Lowest adoption friction. |
| **SMILE Digital** / **SMILE Live** | Same familiarity, signals "this is the new electronic version of the form you know." |
| **QuickLog** / **TapLog** | Describes the benefit (fast logging). Clear, but throws away the existing brand recognition. |
| **Enopi Logger** | Plain and descriptive; safe but forgettable. |

**Recommendation:** keep **SMILE** and re-backronym it to *Student Multi-subject
Individualized Learning Experience*. It preserves what teachers already say out loud,
needs zero re-training on the name, and accurately reflects the expanded scope.

---

## Appendix — Decoded Classroom Title Conventions

| Pattern | Example | Meaning |
|---|---|---|
| Math booklet | `16-2` | Math, Level 16, Booklet 2 |
| Math + Hard Copy | `12-26 HC` | Same, physical printed booklet (**HC = Hard Copy**) |
| Math extra practice | `extra practice 3a pt 16` | Supplementary math practice, Level 3a, Part 16 |
| Math logic | `Logic B2-10` | Logic / word-problem series, Book B2, Part 10 |
| English Pre-A–I | `H7` | English, Level H, Booklet 7 |
| English L5–L8 | `L5-23` | English, Level L5, Booklet 23 |
| English series | `Selection Gr4 Part 6`, `Word Roots Gr3 part 9` | Grade number = the *material* level, not the student's grade |
| Auto-posted quiz | `... via Wayground (formerly Quizizz): ...` | Online quiz, not a booklet log |

**Note:** title format — not the author — identifies a curriculum log. Posts by
"Administrative Staff" can be either real logs (e.g. `H6`, `12-25 HC`) *or*
announcements; only the title pattern is reliable. Titles in the wild are inconsistent
in spacing and case (`14-14 hc`, `14 -13 HC`), so any parser must normalize them.

### Source files
- `math_curriculum.xlsx` — Math curriculum (school-provided, high confidence)
- `english_curriculum_complete.xlsx` — Authoritative English curriculum (Pre-A→L8)
- `english_curriculum_reference_v1.xlsx` — Secondary English reference; keep for its
  *Material Series Reference* and *Classroom Log Decoder* sheets
- `classroom-screenshots/` — real evidence of current logging behavior
- `original-smile-paper-form/` — the paper artifact being replaced (math-only)
