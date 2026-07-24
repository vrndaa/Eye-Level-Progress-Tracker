// SCHEDULE — which students sit with which teacher, in which slot.
//
// This is the ONE thing Google Classroom doesn't know — it comes from the director's
// schedule, which is fixed for 6 months (so it's just static data here, no Excel sync).
// Names must match the student names in classroomData.json.
//
// Each room (English / Maths) has its own teachers.

export const SLOTS = ['3:00pm', '4:00pm', '5:00pm', '6:00pm']

export const TEACHERS = {
  English: ['Ms. Jai', 'Ms. Parker'],
  Math: ['Mr. Devlin', 'Ms. Rivera'],
}

const SCHEDULE = {
  English: {
    'Ms. Jai': {
      '3:00pm': ['Neil Kapoor', 'Ananya Iyer', 'Diya Patel', 'Sara Ali'],
      '4:00pm': ['Ishaan Rao', 'Maya Krishnan', 'Kian Reddy', 'Riya Desai'],
      '5:00pm': ['Zara Sheikh', 'Nikhil Rao', 'Tara Joshi', 'Ayaan Bhat'],
      '6:00pm': [],
    },
    'Ms. Parker': {
      '3:00pm': ['Aarav Mehta', 'Vivaan Shah', 'Arjun Menon', 'Meera Pillai'],
      '4:00pm': ['Priya Nair', 'Rohan Gupta', 'Rehan Qureshi', 'Anika Verma'],
      '5:00pm': ['Kabir Singh', 'Aisha Khan', 'Dev Malhotra', 'Yuvan Nair'],
      '6:00pm': [],
    },
  },
  Math: {
    'Mr. Devlin': {
      '3:00pm': ['Aarav Mehta', 'Priya Nair', 'Diya Patel', 'Riya Desai'],
      '4:00pm': ['Rohan Gupta', 'Maya Krishnan', 'Meera Pillai', 'Yuvan Nair'],
      '5:00pm': ['Kabir Singh', 'Nikhil Rao', 'Ananya Iyer', 'Ayaan Bhat'],
      '6:00pm': [],
    },
    'Ms. Rivera': {
      '3:00pm': ['Ishaan Rao', 'Vivaan Shah', 'Sara Ali', 'Anika Verma'],
      '4:00pm': ['Zara Sheikh', 'Aisha Khan', 'Arjun Menon', 'Neil Kapoor'],
      '5:00pm': ['Dev Malhotra', 'Kian Reddy', 'Tara Joshi', 'Rehan Qureshi'],
      '6:00pm': [],
    },
  },
}

export function teachersFor(subject) {
  return TEACHERS[subject] || []
}

export function rosterFor(subject, teacher, slot) {
  return (SCHEDULE[subject] && SCHEDULE[subject][teacher] && SCHEDULE[subject][teacher][slot]) || []
}
