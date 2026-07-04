// DATA SOURCE — the single seam between the UI and where data actually lives.
//
// For the POC this reads from registry.json, generated from FIC_Registry_POC_data.xlsx
// (see scripts/build-registry.py). To go live, replace the bodies of these two functions
// with Google Sheets API calls against the FIC Registry.
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

import registry from './registry.json'

export async function getSessions() {
  // TODO(live): read the FIC Registry sheet via the Sheets API and map rows to Sessions.
  // Deep-clone so the UI can mutate its copy without touching the source data.
  return structuredClone(registry.sessions)
}

export async function clearFic(/* ficId, cleared */) {
  // TODO(live): update Status / Cleared Date / Teacher on the matching registry row.
  // For the POC the toggle is held in local component state, so this is a no-op.
  return
}

export const SLOTS = registry.SLOTS
export const TEACHERS = registry.TEACHERS
export const SESSION_DATE = registry.SESSION_DATE
