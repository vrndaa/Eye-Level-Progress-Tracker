// AUTO-SET-UP TEST CLASSROOMS
//
// Builds the 4 fake student classrooms (one class per student, 6 topics each, with
// assignments — some FIC, some not) from the blueprint. Fake data on your personal
// Gmail; nothing real is touched. You can wipe it all with --delete.
//
//   node setup-test-classrooms.mjs          → create the 4 classrooms + assignments
//   node setup-test-classrooms.mjs --delete → archive + permanently delete them again
//
// Needs WRITE access (create classes/topics/assignments). Revoke anytime at
// myaccount.google.com → Security → Third-party access.

import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MARKER = 'Enopi test data — safe to delete'

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.topics',
  'https://www.googleapis.com/auth/classroom.coursework.students',
]

const TOPIC_ORDER = ['English Classwork', 'English Homework', 'Maths Classwork', 'Maths Homework', 'To Be Graded', 'Graded']

const STUDENTS = [
  { name: 'Aarav Mehta', grade: 'Gr3', work: {
    'English Classwork': ['Reading Selection Gr3 Week 2', 'DGP Gr3 week 1. fic Jul7'],
    'English Homework': ['Root Words Gr3 part 1'],
    'Maths Classwork': ['Basic Thinking B-2', 'Logic A2-5. fic Jul7'],
    'Maths Homework': ['Number Sense C-1'],
    'To Be Graded': ['Grammar Gr3 set A'],
    'Graded': ['Reading Selection Gr3 Week 1'],
  } },
  { name: 'Priya Nair', grade: 'Gr5', work: {
    'English Classwork': ['Root Words Gr5 part 2. fic Jul1', 'Reading Selection Gr5 Week 2'],
    'English Homework': ['DGP Gr5 week 2'],
    'Maths Classwork': ['Logic B2-11. fic Jul1'],
    'Maths Homework': ['Fractions E-3'],
    'To Be Graded': ['Classic Series D1-4'],
    'Graded': ['Grammar Binder Gr5 Week 1'],
  } },
  { name: 'Ishaan Rao', grade: 'Gr7', work: {
    'English Classwork': ['Critical Reading Gr7 U2'],
    'English Homework': ['DGP Gr7 week 3. fic Jul5'],
    'Maths Classwork': ['Algebra 3-2. fic Jul5'],
    'Maths Homework': ['Ratios F-2'],
    'To Be Graded': ['Vocabulary Gr7 set 4'],
    'Graded': ['Critical Thinking Gr7 U1'],
  } },
  { name: 'Maya Krishnan', grade: 'Gr4', work: {
    'English Classwork': ['DGP Gr4 week 2'],
    'English Homework': ['Root Words Gr4 part 3. fic Jul4'],
    'Maths Classwork': ['Multiplication D2-5'],
    'Maths Homework': ['Fractions D-1. fic Jul4'],
    'To Be Graded': ['Reading Selection Gr4 Week 3'],
    'Graded': ['Basic Thinking Gr4 C-2'],
  } },
]

async function getClassroom() {
  const local = await authenticate({ scopes: SCOPES, keyfilePath: path.join(__dirname, 'credentials.json') })
  const auth = new google.auth.OAuth2()
  auth.setCredentials(local.credentials)
  google.options({ auth })
  return google.classroom({ version: 'v1', auth })
}

// Personal Gmail accounts can't create classes via the API (Google restriction) — so you
// make the 4 empty class shells by hand, and this fills each with topics + assignments.
// Safe to re-run: it skips topics/assignments that already exist.
async function fill(classroom) {
  const courses = (await classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'], pageSize: 200 })).data.courses || []
  const byName = new Map(courses.map((c) => [c.name, c]))
  let missing = 0

  for (const s of STUDENTS) {
    const courseName = `${s.name} ${s.grade}`
    const course = byName.get(courseName)
    if (!course) {
      console.log(`⚠️  Class not found: "${courseName}" — create an empty class with this exact name by hand, then re-run.`)
      missing++
      continue
    }

    const existingTopics = (await classroom.courses.topics.list({ courseId: course.id })).data.topic || []
    const topicByName = new Map(existingTopics.map((t) => [t.name, t.topicId]))
    const existingTitles = new Set(((await classroom.courses.courseWork.list({
      courseId: course.id, courseWorkStates: ['PUBLISHED', 'DRAFT'],
    })).data.courseWork || []).map((w) => w.title))

    console.log(`\n✓ ${courseName}`)
    for (const topicName of TOPIC_ORDER) {
      const titles = s.work[topicName] || []
      if (titles.length === 0) continue
      let topicId = topicByName.get(topicName)
      if (!topicId) {
        topicId = (await classroom.courses.topics.create({ courseId: course.id, requestBody: { name: topicName } })).data.topicId
        topicByName.set(topicName, topicId)
      }
      for (const title of titles) {
        if (existingTitles.has(title)) { console.log(`    (already there) ${title}`); continue }
        await classroom.courses.courseWork.create({
          courseId: course.id,
          requestBody: {
            title,
            description: 'Given: physical notebook (test data)',
            topicId,
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            maxPoints: 100,
          },
        })
        console.log(`    [${topicName}] ${title}`)
      }
    }
  }
  if (missing) console.log(`\n⚠️  ${missing} class(es) not found — create the empty shells by hand and re-run.`)
  else console.log('\n✅ Done. All 4 classrooms filled. (--delete clears the assignments back out.)')
}

// Personal accounts can't delete courses via the API either, so this clears the
// assignments + topics out of the test classes. Delete the empty shells by hand after.
async function remove(classroom) {
  const courses = (await classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'], pageSize: 200 })).data.courses || []
  const names = new Set(STUDENTS.map((s) => `${s.name} ${s.grade}`))
  const targets = courses.filter((c) => names.has(c.name))
  if (targets.length === 0) { console.log('No test classrooms found.'); return }
  for (const c of targets) {
    const cw = (await classroom.courses.courseWork.list({ courseId: c.id, courseWorkStates: ['PUBLISHED', 'DRAFT'] })).data.courseWork || []
    for (const w of cw) await classroom.courses.courseWork.delete({ courseId: c.id, id: w.id })
    const topics = (await classroom.courses.topics.list({ courseId: c.id })).data.topic || []
    for (const t of topics) await classroom.courses.topics.delete({ courseId: c.id, id: t.topicId })
    console.log(`🧹 cleared ${c.name} (${cw.length} assignments, ${topics.length} topics)`)
  }
  console.log('\n✅ Cleared. Delete the now-empty classes by hand in Classroom if you want them gone.')
}

async function main() {
  const classroom = await getClassroom()
  if (process.argv.includes('--delete')) await remove(classroom)
  else await fill(classroom)
}

main().catch((e) => {
  console.error('\n❌ Failed:', e?.errors?.[0]?.message || e.message)
  process.exitCode = 1
})
