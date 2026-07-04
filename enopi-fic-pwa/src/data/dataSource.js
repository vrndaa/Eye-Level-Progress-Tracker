// DATA SOURCE — the single seam between the UI and where data actually lives.
//
// Right now everything reads from mock data. To go live, replace the bodies of
// these two functions with Google Sheets API calls against the FIC Registry.
// The UI never changes — it only knows about this contract:
//
//   getSessions() -> Promise<Session[]>
//     Session = { teacher, slot, students: Student[] }
//     Student = { id, name, grade, note, unmatched, fics: Fic[] }
//     Fic     = { id, program, code, detail, cleared }
//
//   clearFic(ficId, cleared) -> Promise<void>
//     Writes Status (Outstanding <-> Cleared), Cleared Date and Teacher back to
//     that one registry row. It is an UPDATE, never a delete — the row is the record.

import { buildSessions } from './mockData'

export async function getSessions() {
  // TODO(live): read the FIC Registry sheet via the Sheets API and map rows to Sessions.
  return buildSessions()
}

export async function clearFic(/* ficId, cleared */) {
  // TODO(live): update Status / Cleared Date / Teacher on the matching registry row.
  // For the POC the toggle is held in local component state, so this is a no-op.
  return
}

export { SLOTS, TEACHERS, SESSION_DATE } from './mockData'
