# Going live with Google Sheets

By default this app runs **offline** from `src/data/registry.json` (the POC seed). To
make it read and **write back to a real Google Sheet** — so clearing a FIC in the PWA
flips the row's Status live for the director — do the one-time setup below.

Nothing here changes the UI or the offline mode. If `.env` is absent, the app stays offline.

---

## 1. Put the data in a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank**, or **File → Import**.
2. Import `FIC_Registry_POC_data.xlsx` (in this folder). Keep the tab named
   **`FIC Registry (POC data)`** — the app expects that name (override with `VITE_SHEET_NAME` if you rename it).
3. From the URL, copy the **spreadsheet id** — the part between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_ID`**`/edit`
4. Make sure every teacher who'll use the app has **Editor** access to the sheet
   (Share → add their Google accounts). Writes happen as the signed-in teacher.

## 2. Create a Google Cloud project + OAuth client

1. Open [console.cloud.google.com](https://console.cloud.google.com) → create a project
   (e.g. "Enopi FIC Registry").
2. **APIs & Services → Library →** search **Google Sheets API →** **Enable**.
3. **APIs & Services → OAuth consent screen:**
   - User type **External** → Create.
   - Fill app name + your email. Save.
   - **Test users →** add every Google account that will sign in (yours + teachers').
     (In "Testing" mode only listed test users can sign in — that's fine for the POC.)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Application type **Web application**.
   - **Authorized JavaScript origins →** add each origin the app runs on, e.g.
     - `http://localhost:5173`
     - `http://localhost:5174`
     - your deployed URL (e.g. `https://your-app.vercel.app`) when you host it
   - Create, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).

## 3. Point the app at them

1. In this folder, copy `.env.example` to `.env`.
2. Fill in:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   VITE_SPREADSHEET_ID=the-long-id-from-step-1
   ```
3. Restart the dev server (`npm run dev`) — Vite only reads `.env` at startup.

`.env` is gitignored; the Client ID and Spreadsheet ID are not secrets, but keep real
values out of the repo anyway.

## 4. Use it

- Load the app → **Connect Google Sheets** → sign in with a test-user account → grant access.
- The session view now loads from the sheet. **Clear** / **Undo** on a FIC writes back to
  that row: `Status` → Cleared/Outstanding, `Cleared Date` → today, `Cleared By` → teacher.
- Reload, or open the sheet, to see the change reflected live.

## How it maps to the sheet

| Sheet column | App |
|---|---|
| Teacher, Time | session grouping (teacher tab + slot) |
| Student, Grade | student row |
| Strand / Workbook (FIC), Detail | each FIC line |
| Status | Cleared vs Outstanding (what Clear toggles) |
| Cleared Date, Cleared By | stamped on clear |
| Notes | amber hand-match flag / unmatched student |

## Notes & limits (POC)

- **Teacher/slot tabs** come from the offline seed (`registry.json`) so the UI paints
  instantly; live FIC *state* comes from the sheet. If you add a brand-new teacher or slot
  to the sheet, regenerate the seed: `python scripts/build-registry.py`.
- OAuth consent stays in "Testing" — no Google verification needed while it's test-users-only.
- Want an existing Google Sheet instead of importing the xlsx? Just match the column order
  above (or adjust the `COL` map in `src/data/sheets.js`).
