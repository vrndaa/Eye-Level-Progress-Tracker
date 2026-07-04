# Enopi FIC Registry — PWA (working model)

A mobile-first PWA that gives teachers a **glanceable, per-session view of student FICs** (Fix-In-Class items) so they can walk into a session already knowing who needs what — instead of hunting through Google Classroom.

This is a **fake-data working model**. It runs entirely offline: no Google Classroom, no API, no accounts. All data is mock data standing in for the FIC Registry sheet.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL on your phone (same Wi-Fi) or in a desktop browser. `npm run build` produces a production bundle in `dist/`.

## What it does

- Pick a **teacher** and a **time slot** → see that group at session start.
- Each student shows their **outstanding FIC count**; tap to expand.
- Each FIC shows the strand/workbook code **and its detail** (e.g. `DGP · Q15`).
- **Clear / Undo** toggles a FIC's status (held in local state for now).
- A **deep-link icon** marks where each FIC will link to its exact Classroom assignment in the live build.

## Architecture — where to plug in real data

Everything the UI needs comes through **one seam**: `src/data/dataSource.js`.

```
UI (App.jsx)
   │  getSessions()  /  clearFic()
   ▼
dataSource.js   ← swap mock for the Google Sheets API here
   │
   ▼
mockData.js     ← delete once live
```

- `getSessions()` → returns the sessions the UI renders. Replace its body with a Sheets API read of the FIC Registry.
- `clearFic(ficId, cleared)` → writes Status / Cleared Date / Teacher back to that one registry row. **Update, never delete** — the row is the record.

The UI never changes when you go live; only `dataSource.js` does.

## Known seams / open items

- **No shared student key.** Roster (from the Weekly Schedule) and FICs (from the grader's list) were joined **by hand** — schedule `Shrey P` vs grader `Shrey Patel`. A shared student ID is required before this can run automatically. Flagged in-app with amber notes; `unmatched` students show "no FICs logged".
- **FIC detail is sample data.** The `detail` field (Q15 etc.) is populated with examples to show the field. In production the grader fills it — or it's read from / deep-linked to Classroom (director decision).
- **Math is English-only for now.** No real Math FIC list yet.
- **Assign-next is out of scope** for this phase (blocked by the Classroom OAuth project constraint).

## Stack

Vite · React · Tailwind v4 · vite-plugin-pwa · lucide-react
