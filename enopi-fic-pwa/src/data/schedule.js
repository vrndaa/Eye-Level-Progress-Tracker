// PLACEHOLDER SCHEDULE — which students sit with which teacher, in which slot.
//
// This is the ONE thing Google Classroom doesn't know — it comes from the director's
// Excel schedule (not wired yet). So for the COP it's hand-set here. Names must match
// the student names pulled from Classroom (classroomData.json).

export const TEACHERS = ['Ms. Parker', 'Ms. Jai']
export const SLOTS = ['3:00', '4:00', '5:00', '6:00']

export const SCHEDULE = {
  'Ms. Parker': {
    '4:00': ['Priya Nair', 'Aarav Mehta'],
  },
  'Ms. Jai': {
    '4:00': ['Ishaan Rao', 'Maya Krishnan'],
  },
}

export function rosterFor(teacher, slot) {
  return (SCHEDULE[teacher] && SCHEDULE[teacher][slot]) || []
}
