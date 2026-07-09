// DATA SOURCE — the single seam between the UI and where data actually lives.
//
// The app is now a READ-ONLY, student-centric progress lookup. Data mirrors Google
// Classroom (one class per student; work grouped by subject + topic). Today it reads
// mock Classroom data; going live = replace these two functions with Classroom API
// calls. The UI never changes — it only knows this contract:
//
//   getStudents() -> Promise<Student[]>
//     Student = { id, name, grade, counts: { done, fic, notdone } }
//
//   getStudentProgress(id) -> Promise<Progress | null>
//     Progress = { id, name, grade, counts, items: Item[] }
//     Item = { id, subject, topic, title, status, posted, due, fixBy, material, given }
//     status = 'done' | 'fic' | 'notdone'   (green / orange / red)
//     material = the assigned Classroom coursework; given = the physical notebook

import * as classroom from './mockClassroom'

export async function getStudents() {
  return classroom.getStudents()
}

export async function getStudentProgress(id) {
  return classroom.getStudentProgress(id)
}

export const { TOPIC_ORDER, SUBJECT_ORDER } = classroom
