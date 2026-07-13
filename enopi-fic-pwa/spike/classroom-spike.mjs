// GOOGLE CLASSROOM API — FEASIBILITY SPIKE (READ-ONLY)
//
// Proves whether we can READ Classroom data (topics, assignments, statuses) via the API.
// It only ever *reads* — it never creates, edits, or deletes anything. The permissions it
// asks for are all "See / view" scopes. Matches the real product, which is read-only too.
//
// Because it doesn't create anything, YOU make a throwaway test class by hand first (see
// README) — which is also the more meaningful test, since that's how graders really make classes.
//
// Usage:
//   node classroom-spike.mjs              → finds your test class automatically and reads it
//   node classroom-spike.mjs <courseId>   → reads a specific class by id

import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// READ-ONLY scopes only — nothing here can change your Classroom.
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.topics.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
]

const FIC_RE = /\bfic\b/i

async function main() {
  // local-auth returns its own OAuth client; bridge the token into a googleapis-native
  // OAuth2 client so googleapis reliably attaches it to requests (avoids the
  // "duplicate google-auth-library" mismatch that drops the token → 401 Login Required).
  const local = await authenticate({ scopes: SCOPES, keyfilePath: path.join(__dirname, 'credentials.json') })
  const auth = new google.auth.OAuth2()
  auth.setCredentials(local.credentials)
  google.options({ auth })
  console.log('Signed in. Access token present:', !!auth.credentials?.access_token)
  const classroom = google.classroom({ version: 'v1', auth })

  let courseId = process.argv[2]

  if (!courseId) {
    const courses = (await classroom.courses.list({ pageSize: 50 })).data.courses || []
    if (courses.length === 0) {
      console.log('\nNo classes found on this account yet.')
      console.log('Make a throwaway test class by hand first (see README), then run this again.\n')
      return
    }
    console.log('\nYour classes:')
    courses.forEach((c) => console.log(`  • ${c.name}   (id ${c.id})`))
    // Prefer one that looks like a test/spike class; otherwise use the first.
    const pick = courses.find((c) => /spike|test/i.test(c.name || '')) || courses[0]
    courseId = pick.id
    console.log(`\nReading: ${pick.name}  (id ${courseId})`)
  } else {
    console.log(`\nReading course ${courseId}`)
  }

  // ---- THE FEASIBILITY CHECK: can we read it back through the API? ----
  console.log('\n--- reading via the Classroom API ---\n')

  const topics = (await classroom.courses.topics.list({ courseId })).data.topic || []
  const nameByTopic = Object.fromEntries(topics.map((t) => [t.topicId, t.name]))
  console.log(`Topics returned (${topics.length}): ${topics.map((t) => t.name).join(', ') || '(none)'}`)

  const coursework = (await classroom.courses.courseWork.list({
    courseId,
    courseWorkStates: ['PUBLISHED', 'DRAFT'],
  })).data.courseWork || []

  console.log(`\nAssignments returned (${coursework.length}):`)
  for (const cw of coursework) {
    const section = nameByTopic[cw.topicId] || '—'
    const due = cw.dueDate ? `${cw.dueDate.year}-${cw.dueDate.month}-${cw.dueDate.day}` : 'none'
    const fic = FIC_RE.test(cw.title) ? '   <-- FIC detected' : ''
    console.log(`  • [${section}] ${cw.title}   (due ${due})${fic}`)
  }

  if (coursework[0]) {
    const subs = (await classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId: coursework[0].id,
    })).data.studentSubmissions || []
    console.log(`\nSubmission states for "${coursework[0].title}": ` +
      (subs.length ? subs.map((s) => s.state).join(', ') : '(no students enrolled yet)'))
  }

  console.log('\n✅ If you see topics and assignments listed above, the Classroom API read works.')
}

main().catch((e) => {
  console.error('\n❌ Spike failed.')
  console.error('   message:', e.message)
  console.error('   status :', e.code || e.status || '?')
  console.error('   reason :', e?.errors?.[0]?.reason || e?.response?.data?.error?.status || '?')
  console.error('   detail :', e?.response?.data?.error?.message || '(none)')
  process.exitCode = 1
})
