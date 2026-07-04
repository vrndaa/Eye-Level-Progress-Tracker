// GOOGLE SHEETS CLIENT — live read/write against the FIC Registry sheet.
//
// Used only when SHEETS_ENABLED (see googleConfig.js). Auth is Google Identity
// Services (GIS) OAuth token flow: no backend, no API key, and the sheet stays
// private — the signed-in user must have access to it. connect() MUST be called
// from a user gesture (a click), or the browser blocks the consent popup.

import { GOOGLE_CONFIG } from './googleConfig'

const API = 'https://sheets.googleapis.com/v4/spreadsheets'
// A1:L covers all registry columns; header is row 1, data starts at row 2.
const RANGE = `${GOOGLE_CONFIG.sheetName}!A1:L`
// 0-indexed columns within A:L.
const COL = { teacher: 0, time: 1, student: 2, grade: 3, program: 4, fic: 5,
              detail: 6, status: 7, clearedDate: 8, readyNext: 9, clearedBy: 10, notes: 11 }

let tokenClient = null
let accessToken = null
// Maps a fic id -> { row, teacher } so clearFic knows which sheet row to update.
const rowByFicId = new Map()

// --- auth ---------------------------------------------------------------

function waitForGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    let waited = 0
    const t = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(t); resolve() }
      else if ((waited += 50) > 10000) { clearInterval(t); reject(new Error('Google sign-in script failed to load')) }
    }, 50)
  })
}

// Acquire an OAuth access token. Call from a click. Resolves once granted.
export async function connect() {
  await waitForGis()
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scope,
      callback: () => {}, // replaced per request below
    })
  }
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error))
      accessToken = resp.access_token
      resolve()
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' })
  })
}

export function isConnected() {
  return Boolean(accessToken)
}

async function api(path, options = {}) {
  const res = await fetch(`${API}/${GOOGLE_CONFIG.spreadsheetId}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sheets API ${res.status}: ${body}`)
  }
  return res.json()
}

// --- read ---------------------------------------------------------------

// Fetch the sheet and shape it into the same Session[] the UI consumes,
// tagging each fic with its sheet row so it can be written back.
export async function getSessions() {
  rowByFicId.clear()
  const data = await api(`/values/${encodeURIComponent(RANGE)}`)
  const rows = data.values || []
  const cell = (r, i) => (r[i] == null ? '' : String(r[i]).trim())

  // Preserve first-appearance order for teachers and sort slots by hour.
  const teachers = []
  const slotSet = new Set()
  const byTeacherSlot = new Map() // "teacher||slot" -> [{row, ...}]

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const teacher = cell(r, COL.teacher)
    const slot = cell(r, COL.time)
    if (!teacher || !slot) continue
    if (!teachers.includes(teacher)) teachers.push(teacher)
    slotSet.add(slot)
    const key = `${teacher}||${slot}`
    if (!byTeacherSlot.has(key)) byTeacherSlot.set(key, [])
    byTeacherSlot.get(key).push({ sheetRow: i + 1, r, cell: (i2) => cell(r, i2) })
  }

  const slots = [...slotSet].sort((a, b) => parseInt(a) - parseInt(b))
  const sessions = []
  for (const teacher of teachers) {
    for (const slot of slots) {
      const entries = byTeacherSlot.get(`${teacher}||${slot}`) || []
      // Group consecutive rows by student, preserving order.
      const order = []
      const groups = new Map()
      for (const e of entries) {
        const name = e.cell(COL.student)
        if (!groups.has(name)) { groups.set(name, []); order.push(name) }
        groups.get(name).push(e)
      }
      const students = order.map((name, si) => {
        const rowsForStudent = groups.get(name)
        const first = rowsForStudent[0]
        const grade = first.cell(COL.grade) || '—'
        const note = first.cell(COL.notes)
        const ficRows = rowsForStudent.filter((e) => e.cell(COL.fic))
        const unmatched = ficRows.length === 0
        const noteOut = unmatched || (note && note.includes('no FIC match')) ? null : (note || null)
        const fics = ficRows.map((e, fj) => {
          const id = `${teacher}|${slot}|${si}|${fj}`
          rowByFicId.set(id, { row: e.sheetRow, teacher })
          return {
            id,
            program: e.cell(COL.program) || 'English',
            code: e.cell(COL.fic),
            detail: e.cell(COL.detail) || '',
            cleared: e.cell(COL.status).toLowerCase() === 'cleared',
          }
        })
        return { id: `${teacher}|${slot}|${si}`, name, grade, note: noteOut, unmatched, fics }
      })
      sessions.push({ teacher, slot, students })
    }
  }
  return sessions
}

// --- write --------------------------------------------------------------

// Flip one registry row's Status (and Cleared Date / Cleared By) in place.
// An UPDATE, never a delete — the row is the record.
export async function clearFic(ficId, cleared) {
  const info = rowByFicId.get(ficId)
  if (!info) throw new Error(`No sheet row known for fic ${ficId}`)
  const { row, teacher } = info
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const sheet = GOOGLE_CONFIG.sheetName
  const data = [
    { range: `${sheet}!H${row}`, values: [[cleared ? 'Cleared' : 'Outstanding']] },
    { range: `${sheet}!I${row}`, values: [[cleared ? today : '']] },
    { range: `${sheet}!K${row}`, values: [[cleared ? teacher : '']] },
  ]
  await api(`/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
  })
}
