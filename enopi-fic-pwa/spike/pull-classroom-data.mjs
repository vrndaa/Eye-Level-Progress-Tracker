// PULL CLASSROOM DATA → app format
//
// Reads your test classrooms (read-only) and writes them into the app's data file
// (src/data/classroomData.json), so the app shows real Classroom data on its screens.
// Reuses the read-only access already granted — no new setup.
//
//   node pull-classroom-data.mjs

import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'data', 'classroomData.json')

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.topics.readonly',
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FIC_RE = /\bfic\b/i
const ENGLISH_HINT = /dgp|reading|root words|grammar|vocab|critical reading|classic series|comprehension|selection/i
const MATH_HINT = /logic|basic thinking|critical thinking|number sense|fraction|algebra|ratio|multiplication|division/i

// "Aarav Mehta Gr3" -> { name: "Aarav Mehta", grade: "Gr3" }
function splitName(courseName) {
  const m = courseName.match(/^(.*?)\s+(Gr[\w/]+)\s*$/i)
  return m ? { name: m[1].trim(), grade: m[2] } : { name: courseName, grade: '—' }
}

// Classroom topic + title -> the app's { subject, topic }
function mapSubjectTopic(topicName, title) {
  const t = topicName || ''
  if (/english/i.test(t)) return { subject: 'English', topic: t.replace(/english\s*/i, '').trim() || 'Classwork' }
  if (/math/i.test(t)) return { subject: 'Math', topic: t.replace(/maths?\s*/i, '').trim() || 'Classwork' }
  // "To Be Graded" / "Graded" have no subject in the name — infer from the title.
  const subject = MATH_HINT.test(title) ? 'Math' : ENGLISH_HINT.test(title) ? 'English' : 'English'
  return { subject, topic: t || 'Classwork' }
}

// A `fic` tag stays in the title forever (so the director keeps FIC history), but it only
// counts as an ACTIVE fic while the work sits in Classwork/Homework. Once it moves to
// "To Be Graded" / "Graded" it's a CLEARED fic — treat as submitted/done, not outstanding.
function statusFor(topicName, title) {
  if (/to be graded/i.test(topicName)) return 'submitted'
  if (/graded/i.test(topicName)) return 'done'
  return FIC_RE.test(title) ? 'fic' : 'notdone'
}

function ficDate(title) {
  const m = title.match(/fic\s+([A-Za-z]{3}\s?\d{1,2})/i)
  return m ? m[1].replace(/([A-Za-z]{3})(\d)/, '$1 $2') : null
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

async function main() {
  const local = await authenticate({ scopes: SCOPES, keyfilePath: path.join(__dirname, 'credentials.json') })
  const auth = new google.auth.OAuth2()
  auth.setCredentials(local.credentials)
  google.options({ auth })
  const classroom = google.classroom({ version: 'v1', auth })

  const courses = (await classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'], pageSize: 200 })).data.courses || []
  const students = []

  for (const course of courses) {
    const topics = (await classroom.courses.topics.list({ courseId: course.id })).data.topic || []
    const topicName = Object.fromEntries(topics.map((t) => [t.topicId, t.name]))
    const coursework = (await classroom.courses.courseWork.list({
      courseId: course.id, courseWorkStates: ['PUBLISHED'],
    })).data.courseWork || []
    // Skip empty classes (e.g. the old "API Spike" one, or shells with no work).
    if (coursework.length === 0) continue

    const { name, grade } = splitName(course.name)
    const items = coursework.map((cw, i) => {
      const tName = topicName[cw.topicId] || ''
      const { subject, topic } = mapSubjectTopic(tName, cw.title)
      return {
        id: `${course.id}-${i}`,
        subject,
        topic,
        title: cw.title,
        status: statusFor(tName, cw.title),
        wasFic: FIC_RE.test(cw.title),      // ever a fic (kept for history, even once cleared)
        posted: fmtDate(cw.creationTime),   // when assigned
        due: cw.dueDate ? `${MONTHS[cw.dueDate.month - 1]} ${cw.dueDate.day}` : '',
        fixBy: ficDate(cw.title),
        material: (cw.materials && cw.materials[0]?.driveFile?.driveFile?.title) || '',
        given: (cw.description || '').replace(/^given:\s*/i, ''),
      }
    })
    students.push({ id: `stu-${course.id}`, name, grade, items })
  }

  fs.writeFileSync(OUT, JSON.stringify({ students }, null, 2))
  const nItems = students.reduce((n, s) => n + s.items.length, 0)
  console.log(`\n✅ Pulled ${students.length} students, ${nItems} assignments → src/data/classroomData.json`)
  students.forEach((s) => console.log(`   • ${s.name} ${s.grade} — ${s.items.length} items`))
  console.log('\nNow run the app (npm run dev) to see real Classroom data on its screens.')
}

main().catch((e) => {
  console.error('\n❌ Pull failed:', e?.errors?.[0]?.message || e.message)
  process.exitCode = 1
})
