// GENERATE ~6 MONTHS OF DEMO DATA → src/data/classroomData.json
//
// A realistic view for the director: ~10 students, both subjects, ~6 months of sessions
// with progressing levels, a recent FIC, current not-started work (with due dates), plus a
// cleared FIC and an overdue item. Illustrative demo data (the real Classroom pull replaces it).
// Dates are anchored to TODAY so it always reads correctly whenever it's shown.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'data', 'classroomData.json')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${MONTHS[d.getMonth()]} ${d.getDate()}` }
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-')

// ~6 months of sessions, every 6 days, oldest → today.
const OFFSETS = []
for (let n = 180; n >= 0; n -= 6) OFFSETS.push(-n)
const DATES = OFFSETS.map(dayOffset)

const STUDENTS = [
  { name: 'Priya Nair', grade: 'Gr5' }, { name: 'Aarav Mehta', grade: 'Gr3' },
  { name: 'Ishaan Rao', grade: 'Gr7' }, { name: 'Maya Krishnan', grade: 'Gr4' },
  { name: 'Rohan Gupta', grade: 'Gr6' }, { name: 'Zara Sheikh', grade: 'Gr4' },
  { name: 'Kabir Singh', grade: 'Gr5' }, { name: 'Aisha Khan', grade: 'Gr7' },
  { name: 'Dev Malhotra', grade: 'Gr6' }, { name: 'Neil Kapoor', grade: 'Gr3' },
  { name: 'Ananya Iyer', grade: 'Gr5' }, { name: 'Vivaan Shah', grade: 'Gr8' },
  { name: 'Diya Patel', grade: 'Gr2' }, { name: 'Arjun Menon', grade: 'Gr6' },
  { name: 'Sara Ali', grade: 'Gr4' }, { name: 'Kian Reddy', grade: 'Gr7' },
  { name: 'Riya Desai', grade: 'Gr3' }, { name: 'Nikhil Rao', grade: 'Gr8' },
  { name: 'Tara Joshi', grade: 'Gr5' }, { name: 'Ayaan Bhat', grade: 'Gr2' },
  { name: 'Meera Pillai', grade: 'Gr6' }, { name: 'Rehan Qureshi', grade: 'Gr4' },
  { name: 'Anika Verma', grade: 'Gr7' }, { name: 'Yuvan Nair', grade: 'Gr3' },
]

// "which question / where to work" for outstanding items — the actionable bit teachers want.
const DETAILS = ['Q15', 'Q3, Q7', 'Q4', 'pg 12', 'Ex 5', 'Q8', 'pg 6', 'Q11, Q12', 'pg 20, Q2', 'Q1-3']

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
        const picks = [tracks[(di * 2 + si) % tracks.length], tracks[(di * 2 + si + 1) % tracks.length]]
        picks.forEach((t, k) => {
          const level = t.prefix ? `${t.prefix}-${t.n}` : `Week ${t.n}`
          t.n += 1
          let status = 'done'
          let fixBy = null
          let due = ''
          if (last) { status = 'notdone'; due = k === 0 ? dayOffset(4) : dayOffset(2) }
          else if (nearLast && k === 0) { status = 'fic'; fixBy = dayOffset(-1) }
          const ficTag = status === 'fic' ? `. fic ${dayOffset(-1).replace(' ', '')}` : ''
          items.push({
            id: `${slug(stu.name)}-${subject}-${di}-${k}`,
            subject,
            topic: status === 'done' ? 'Graded' : 'Classwork',
            title: `${t.name} ${level}${ficTag}`,
            status,
            wasFic: status === 'fic',
            // question / location the student needs to work on (only for outstanding work)
            detail: status === 'done' ? '' : DETAILS[(di + k + si) % DETAILS.length],
            posted: date,
            due,
            fixBy,
          })
        })
      })
    }
    // A cleared FIC (was a fic, now graded — kept for history) and an overdue not-started item.
    items.push({ id: `${slug(stu.name)}-clearedfic`, subject: 'English', topic: 'Graded', title: `DGP D-3. fic ${dayOffset(-40).replace(' ', '')}`,
      status: 'done', wasFic: true, detail: '', posted: dayOffset(-42), due: '', fixBy: dayOffset(-40) })
    items.push({ id: `${slug(stu.name)}-overdue`, subject: 'English', topic: 'Homework', title: 'Comprehension E-9',
      status: 'notdone', wasFic: false, detail: 'Q9', posted: dayOffset(-12), due: dayOffset(-5), fixBy: null })
    return { id: `stu-${slug(stu.name)}`, name: stu.name, grade: stu.grade, items }
  })
  return { students }
}

const data = build()
fs.writeFileSync(OUT, JSON.stringify(data, null, 2))
const n = data.students.reduce((a, s) => a + s.items.length, 0)
console.log(`Wrote ${data.students.length} students, ${n} items across ${DATES.length} sessions (~6 months) → src/data/classroomData.json`)
