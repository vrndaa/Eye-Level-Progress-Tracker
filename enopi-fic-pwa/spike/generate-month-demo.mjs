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

// Dates are anchored to TODAY so the demo always reads correctly whenever it's shown
// (the most recent session = today; current work due in a few days; one item overdue).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${MONTHS[d.getMonth()]} ${d.getDate()}` }
const DATES = [-30, -26, -22, -18, -14, -10, -6, -3, 0].map(dayOffset) // oldest → today

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
          // Older sessions done; most recent not started (with a due date); one FIC just before.
          let status = 'done'
          let fixBy = null
          let due = ''
          if (last) { status = 'notdone'; due = k === 0 ? dayOffset(4) : dayOffset(2) }
          else if (nearLast && k === 0) { status = 'fic'; fixBy = dayOffset(-1) }
          const ficTag = status === 'fic' ? `. fic ${dayOffset(-1).replace(' ', '')}` : ''
          items.push({
            id: `${stu.id}-${subject}-${di}-${k}`,
            subject,
            topic: status === 'done' ? 'Graded' : 'Classwork',
            title: `${t.name} ${level}${ficTag}`,
            status,
            wasFic: status === 'fic',
            posted: date,
            due,
            fixBy,
            material: '',
            given: 'physical notebook',
          })
        })
      })
    }
    // Showcase the director's feedback:
    // (a) a CLEARED fic — was a fic, now graded (kept for history, not outstanding)
    items.push({ id: `${stu.id}-clearedfic`, subject: 'English', topic: 'Graded', title: `DGP D-3. fic ${dayOffset(-22).replace(' ', '')}`,
      status: 'done', wasFic: true, posted: dayOffset(-24), due: '', fixBy: dayOffset(-22), material: '', given: 'physical notebook' })
    // (b) an OVERDUE not-started — assigned earlier, due date already passed
    items.push({ id: `${stu.id}-overdue`, subject: 'English', topic: 'Homework', title: 'Comprehension E-4',
      status: 'notdone', wasFic: false, posted: dayOffset(-12), due: dayOffset(-5), fixBy: null, material: '', given: 'physical notebook' })
    return { ...stu, items }
  })
  return { students }
}

const data = build()
fs.writeFileSync(OUT, JSON.stringify(data, null, 2))
const n = data.students.reduce((a, s) => a + s.items.length, 0)
console.log(`Wrote ${data.students.length} students, ${n} items across ${DATES.length} session dates → src/data/classroomData.json`)
