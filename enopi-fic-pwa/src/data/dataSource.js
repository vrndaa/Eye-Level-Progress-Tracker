// DATA SOURCE — the single seam between the UI and where data actually lives.
//
// Two modes, chosen by whether a Google Sheet is configured (see googleConfig.js):
//   OFFLINE (default): reads the registry.json seed generated from the POC Excel.
//   LIVE:   reads/writes a real Google Sheet via the Sheets API.
// The UI never changes — it only knows this contract:
//
//   getSessions() -> Promise<Session[]>
//     Session = { teacher, slot, students: Student[] }
//     Student = { id, name, grade, note, unmatched, fics: Fic[] }
//     Fic     = { id, program, code, detail, cleared }
//
//   clearFic(ficId, cleared) -> Promise<void>
//     Writes Status (Outstanding <-> Cleared), Cleared Date and Teacher back to
//     that one registry row. It is an UPDATE, never a delete — the row is the record.
//
//   connect() -> Promise<void>   (LIVE only) acquire Google auth; call from a click.

import registry from './registry.json'
import { SHEETS_ENABLED } from './googleConfig'
import * as sheets from './sheets'

export { SHEETS_ENABLED } from './googleConfig'

export async function getSessions() {
  if (SHEETS_ENABLED) return sheets.getSessions()
  // Offline: deep-clone so the UI can mutate its copy without touching the seed.
  return structuredClone(registry.sessions)
}

export async function clearFic(ficId, cleared) {
  if (SHEETS_ENABLED) return sheets.clearFic(ficId, cleared)
  // Offline POC: the toggle lives in local component state, so this is a no-op.
  return
}

// LIVE only — acquire a Google OAuth token (must be triggered by a user gesture).
// In offline mode this resolves immediately so callers don't need to branch.
export async function connect() {
  if (SHEETS_ENABLED) return sheets.connect()
  return
}

// Tabs come from the seed so the UI has a stable teacher/slot list on first paint;
// the live sheet fills in FIC state. (Regenerate the seed if the roster changes.)
export const SLOTS = registry.SLOTS
export const TEACHERS = registry.TEACHERS
export const SESSION_DATE = registry.SESSION_DATE
