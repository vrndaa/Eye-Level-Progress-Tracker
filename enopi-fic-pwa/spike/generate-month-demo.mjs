// GENERATE ONE MONTH OF DEMO DATA → src/data/classroomData.json
//
// For the director preview: fills the 4 students with ~a month of sessions so the SMILE
// grid shows real history + progression, not just one day. Illustrative demo data — the
// real Classroom pull (pull-classroom-data.mjs) will replace it whenever you re-run it.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'data', 'classroomData.json')

const DATES = ['Jun 16', 'Jun 19', 'Jun 23', 'Jun 26', 'Jun 30', 'Jul 3', 'Jul 7', 'Jul 10', 'Jul 14']

const STUDENTS = [
  { id: 'stu-priya', name: 'Priya Nair', grade: 'Gr5' },
  { id: 'stu-aarav', name: 'Aarav Mehta', grade: 'Gr3' },
  { id: 'stu-ishaan', name: 'Ishaan Rao', grade: 'Gr7' },
  { id: 'stu-maya', name: 'Maya Krishnan', grade: 'Gr4' },
]

// strand title-name, level prefix, starting number  (prefix '' => "Week N")
const TRACKS = {
  English: [
    ['Reading Selection', 'W', 1],
    ['Root Words', 'C', 2],
    ['DGP', 'D', 4],
    ['Comprehension', 'E', 1],
    ['Grammar Binder', '', 1],
  ],
  Math: [
    ['Basic Thinking', 'B', 2],
    ['Critical Thinking', 'A', 3],
    ['Logic', 'B2', 8],
    ['Fractions', 'E', 1],
  ],
}

function build() {
  const students = STUDENTS.map((stu, si) => {
    const items = []
    for (const subject of ['English', 'Math']) {
      const tracks = TRACKS[subject].map(([name, prefix, start]) => ({ name, prefix, n: start + si }))
      DATES.forEach((date, di) => {
        const last = di === DATES.length - 1
        const nearLast = di === DATES.length - 2
        // Two strands per session, rotating through the list.
        const picks = [tracks[(di * 2 + si) % tracks.length], tracks[(di * 2 + si + 1) % tracks.length]]
        picks.forEach((t, k) => {
          const level = t.prefix ? `${t.prefix}-${t.n}` : `Week ${t.n}`
          t.n += 1
          // Older sessions done; most recent not started; one FIC just before.
          let status = 'done'
          let fixBy = null
          if (last) status = 'notdone'
          else if (nearLast && k === 0) { status = 'fic'; fixBy = 'Jul 12' }
          const ficTag = status === 'fic' ? '. fic Jul12' : ''
          items.push({
            id: `${stu.id}-${subject}-${di}-${k}`,
            subject,
            topic: status === 'done' ? 'Graded' : 'Classwork',
            title: `${t.name} ${level}${ficTag}`,
            status,
            posted: date,
            due: '',
            fixBy,
            material: '',
            given: 'physical notebook',
          })
        })
      })
    }
    return { ...stu, items }
  })
  return { students }
}

const data = build()
fs.writeFileSync(OUT, JSON.stringify(data, null, 2))
const n = data.students.reduce((a, s) => a + s.items.length, 0)
console.log(`Wrote ${data.students.length} students, ${n} items across ${DATES.length} session dates → src/data/classroomData.json`)
