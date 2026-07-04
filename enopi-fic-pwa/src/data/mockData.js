// MOCK DATA — stands in for the FIC Registry until the Google Sheets API is wired up.
//
// Roster (teacher x time slot x student) is hand-cleaned from the Weekly Class
// Schedule. FICs come from the grader's English list. The join was done BY HAND
// because the two sheets don't share a student key yet (schedule "Shrey P" vs
// grader "Shrey Patel"). `unmatched: true` = on the schedule but not on the grader
// list. `note` = a hand-match that needs confirming.
//
// `detail` is the FIC-level detail (e.g. "Q15") — the actionable bit that today
// lives in the Google Classroom headline. Values below are SAMPLES to show the
// field; in production the grader fills these per row.

const ROSTER = {
  'Ms. Parker': {
    '3:00': [
      { name: 'Anaya Shah', grade: 'Gr4', eng: [['RS', 'pg 12'], ['RW', '']] },
      { name: 'Jyoshnaa', grade: 'Gr3', eng: [['DGP', 'Q15'], ['RS', ''], ['PF', ''], ['PR', ''], ['CS', ''], ['GRAMMAR', '']] },
      { name: 'Mariah', grade: 'Gr5', eng: [['DGP', ''], ['CS', ''], ['PR', 'Q4'], ['RS', ''], ['RW', '']] },
      { name: 'Sophia A', grade: 'Gr6', eng: [['RS', ''], ['GRAMMAR', ''], ['DGP', ''], ['RW', ''], ['CS', ''], ['PR', '']] },
    ],
    '4:00': [
      { name: 'Myrah', grade: 'Gr2', eng: [['DGP', 'Q3, Q7'], ['NS', ''], ['PF', ''], ['GRAMMAR', '']] },
      { name: 'Rida', grade: 'Gr3', eng: [['DGP', ''], ['RS', ''], ['CS', ''], ['PF', '']] },
      { name: 'Asha P', grade: 'Gr5', eng: [['RS', ''], ['GRAMMAR', 'Q8'], ['DGP', ''], ['RW', ''], ['CS', '']] },
      { name: 'Zeeyah', grade: 'Gr6', eng: [['DGP', ''], ['RW', ''], ['CS', ''], ['GRAMMAR', ''], ['RS', '']] },
    ],
    '5:00': [
      { name: 'Aadhya P', grade: 'Gr1', eng: [['GRAMMAR', ''], ['PF', ''], ['NS', ''], ['READING', 'pg 5']] },
      { name: 'Shravya', grade: '\u2014', eng: [], unmatched: true },
      { name: 'Macorina', grade: 'Gr3', eng: [['DGP', ''], ['RS', ''], ['PF', ''], ['PR', ''], ['GRAMMAR', '']] },
      { name: 'Meher', grade: 'Gr4', eng: [['RS', ''], ['DGP', ''], ['CS', '']], note: 'matched to Mehar Kaur' },
    ],
    '6:00': [
      { name: 'Srishti', grade: 'Gr7/8', eng: [['SR', ''], ['GRAMMAR', ''], ['DGP', 'Q11'], ['RW', ''], ['CS', ''], ['RS', '']] },
      { name: 'Spoorthi', grade: 'Gr3', eng: [['GRAMMAR', ''], ['CS', ''], ['DGP', ''], ['RS', '']] },
      { name: 'Aditi Singh', grade: 'Gr8', eng: [['SR', ''], ['GRAMMAR', ''], ['DGP', ''], ['RW', ''], ['CS', ''], ['RS', '']] },
      { name: 'Anish', grade: 'Gr7', eng: [['SV', ''], ['RS', ''], ['GRAMMAR', ''], ['DGP', ''], ['RW', ''], ['CS', '']] },
    ],
  },
  'Ms. Jai': {
    '3:00': [
      { name: 'Ahyaan', grade: 'Gr4', eng: [['RS', ''], ['DGP', ''], ['RW', ''], ['CS', ''], ['PR', '']] },
      { name: 'Shrey P', grade: 'Gr4', eng: [['RS', ''], ['DGP', 'Q2'], ['RW', ''], ['CS', '']], note: 'matched to Shrey Patel' },
      { name: 'Ayaan', grade: 'Gr2', eng: [['DGP', ''], ['NS', ''], ['PF', ''], ['GRAMMAR', '']] },
      { name: 'Guhan', grade: 'Gr6', eng: [['RS', ''], ['GRAMMAR', ''], ['DGP', ''], ['RW', ''], ['CS', '']] },
    ],
    '4:00': [
      { name: 'Shanyza', grade: 'Gr4', eng: [['RS', ''], ['DGP', ''], ['RW', ''], ['CS', ''], ['PR', '']] },
      { name: 'Niyam', grade: 'Gr1', eng: [['NS', ''], ['GRAMMAR', ''], ['DGP', '']] },
      { name: 'Maghizh', grade: 'Gr5', eng: [['DGP', ''], ['PR', ''], ['RS', ''], ['RW', '']] },
      { name: 'Siddarth', grade: 'Gr6', eng: [['RS', ''], ['GRAMMAR', ''], ['CS', '']] },
    ],
    '5:00': [
      { name: 'Narain', grade: 'Gr3', eng: [['DGP', ''], ['RS', ''], ['PF', ''], ['CS', ''], ['GRAMMAR', ''], ['PR', 'Q9']] },
      { name: 'Rohit', grade: 'Gr1', eng: [['DGP', ''], ['NS', ''], ['PF', ''], ['GRAMMAR', '']] },
      { name: 'Amelia', grade: 'Gr2', eng: [['DGP', ''], ['GRAMMAR', '']] },
      { name: 'Shivani', grade: 'Gr4', eng: [['RS', ''], ['DGP', ''], ['RW', ''], ['PR', '']] },
    ],
    '6:00': [
      { name: 'Suman', grade: 'Gr2', eng: [['DGP', 'Q15']] },
      { name: 'Meher', grade: 'Gr4', eng: [['RS', ''], ['DGP', ''], ['CS', '']], note: 'matched to Mehar Kaur' },
      { name: 'Ayan', grade: '\u2014', eng: [], unmatched: true, note: 'Weenopi room' },
    ],
  },
}

export const SLOTS = ['3:00', '4:00', '5:00', '6:00']
export const TEACHERS = Object.keys(ROSTER)
export const SESSION_DATE = 'Wed, Jul 1'

// Flatten ROSTER into the session shape the app consumes.
export function buildSessions() {
  const sessions = []
  for (const teacher of TEACHERS) {
    for (const slot of SLOTS) {
      const students = (ROSTER[teacher][slot] || []).map((s, i) => ({
        id: `${teacher}|${slot}|${i}`,
        name: s.name,
        grade: s.grade,
        note: s.note || null,
        unmatched: !!s.unmatched,
        fics: (s.eng || []).map(([code, detail], j) => ({
          id: `${teacher}|${slot}|${i}|${j}`,
          program: 'English',
          code,
          detail: detail || '',
          cleared: false,
        })),
      }))
      sessions.push({ teacher, slot, students })
    }
  }
  return sessions
}
