# SMILE Engine — Phase 0

The non-visual core of the SMILE session logger. **No UI, no Google access.** It does
three jobs:

1. **Knows the curriculum** — the full Math (690 booklets) and English (620 booklets)
   sequences, loaded from the school spreadsheets.
2. **Reads** messy Classroom assignment titles into structured data (the *parser*).
3. **Writes** the exact title text the center already uses (the *generator*), and works
   out **what booklet comes next** for a student (the *position engine*).

This is the foundation everything else stands on. It's built and tested in isolation so
the risky decoding logic is proven before any screens or Google integration exist.

## Try it

```bash
cd engine
npm install
npm run demo      # human-readable walkthrough
npm test          # 24 tests, incl. round-trip over all 1,310 booklets
npm run typecheck # TypeScript type checking
```

## How it fits together

| File | Role | Plain English |
|------|------|---------------|
| `data/math.json`, `data/english.json` | Curriculum data | The "what comes next" rulebook, generated from the spreadsheets |
| `src/curriculum.ts` | Sequence access | Look up a booklet; step forward/back through the sequence |
| `src/parser.ts` | **Reader** | Messy title (`14 -13 HC`) → structured (`Math, level 14, booklet 13, hard copy`) |
| `src/generator.ts` | **Writer** | Structured selection → exact title (`H7`, `12-26 HC`) |
| `src/position.ts` | **Position engine** | Student history → "here's the next booklet to log" |
| `src/index.ts` | Public API | What the rest of the app imports |
| `src/demo.ts` | Demo | A runnable example |

## Title formats it handles

| Pattern | Example | Meaning |
|---------|---------|---------|
| Math booklet | `16-2`, `12-26 HC` | Level-booklet (HC = hard copy). Tolerant of `14 -13 HC`, `14-14 hc`. |
| English A–I | `H7` | Letter + number, no separator |
| English Pre-A | `Pre-A-7` | |
| English L5–L8 | `L5-23` | |
| Extra practice | `extra practice 3a pt 16` | Supplementary math |
| Logic | `Logic B2-10` | Supplementary math |
| Graded series | `Word Roots Gr3 part 9` | English supplementary (grade = material level) |
| Grammar / vocab / reading | `DGP week 12`, `SAT Vocab unit 7` | English supplementary |
| Quiz | `... via Wayground ...` | Not a curriculum log |
| Announcement | `Summer Hours for 2026` | Not a curriculum log |

## Known limitations (by design, for Phase 0)

- **Two math tracks look identical in legacy titles.** Basic Thinking and Critical
  Thinking math are both logged as bare `level-booklet`, so old titles can't be told
  apart. The position engine accepts a `track` tag to disambiguate going forward — the
  app will store that tag in the Classroom description metadata it writes.
- **English L5–L8 topic text is unverified** (`[Verify]` in the source). The *sequence*
  and *title format* are correct; only the descriptive topic strings need confirming
  against a real Grade 5+ student.
- Supplementary series are classified and their parts extracted, but they don't auto-
  advance (they aren't a single fixed sequence). The teacher enters those directly.
