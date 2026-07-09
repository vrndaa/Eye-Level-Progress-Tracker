// MOCK CLASSROOM DATA — stands in for the Google Classroom API until it's wired up.
//
// Mirrors how Enopi actually uses Classroom: ONE class per student, work grouped
// into topics (Classwork / Homework / To Be Graded / Graded) per subject. Each item
// carries what the real API gives us so the UI never changes when we go live:
//
//   status  'done' | 'fic' | 'notdone'   -> the green / orange / red dot
//   assigned  the online material the grader drafted (the coursework item)
//   given     the physical notebook handed out in class (from the assignment header)
//   fixBy     set only on FICs — the "fix in class by" date it was returned with
//
// FIC lifecycle mirrored here: Classwork -> To Be Graded -> returned to Classwork
// with a fixBy date. A 'fic' item is one that came back to be fixed.

// Compact authoring format per item: [title, status, extras]
//   extras = { posted, due, fixBy?, material, given }
const STUDENTS = [
  {
    name: 'Sarina', grade: 'Gr5',
    work: {
      English: {
        Classwork: [
          ['Root Words Gr 5 part 2', 'fic', { posted: 'Jun 24', due: 'Jun 27', fixBy: 'Jun 28', material: 'RootWords LevelA book2 (PDF)', given: 'Root Words notebook — p.14' }],
          ['DGP Gr 5 week 1', 'fic', { posted: 'Jun 13', due: 'Jun 20', fixBy: 'Jun 25', material: 'DGP Guide Gr5 (PDF)', given: 'DGP binder — week 1' }],
          ['Reading Selection Gr5 Week 2', 'done', { posted: 'Jun 20', due: 'Jun 24', material: 'Reading Selection Gr5 W2 (PDF)', given: 'Reading folder — sel. 2' }],
        ],
        Homework: [
          ['Write an essay comparing Eastern & Western tales', 'notdone', { posted: 'Jun 30', due: 'Jul 4', material: 'Essay prompt (Doc)', given: 'Writing notebook' }],
          ['Root Words Gr 5 part 3', 'done', { posted: 'Jun 28', due: 'Jul 4', material: 'RootWords LevelA book3 (PDF)', given: 'Root Words notebook — p.18' }],
        ],
        'To Be Graded': [
          ['Classic Series D1-4', 'done', { posted: 'Jun 27', due: 'Jul 11', material: 'Classic Series D1-4 (PDF)', given: 'Classic Series book D1' }],
        ],
        Graded: [
          ['Gr5 Grammar Binder Week 1', 'done', { posted: 'Jun 13', due: 'Jun 18', material: 'Grammar Binder W1 (PDF)', given: 'Grammar binder — wk 1' }],
        ],
      },
      Math: {
        Classwork: [
          ['Logic B2-11', 'fic', { posted: 'Jun 24', due: 'Jun 27', fixBy: 'Jul 1', material: 'Logic B2-11 (PDF)', given: 'Logic workbook B2 — p.11' }],
        ],
        Homework: [
          ['Fractions E-3 set 2', 'notdone', { posted: 'Jun 30', due: 'Jul 5', material: 'Fractions E-3 (PDF)', given: 'Math workbook E — p.22' }],
        ],
      },
    },
  },
  {
    name: 'Anayra Patel', grade: 'Gr4',
    work: {
      English: {
        Classwork: [
          ['DGP Gr 4 week 2', 'fic', { posted: 'Jun 26', due: 'Jun 30', fixBy: 'Jul 2', material: 'DGP Guide Gr4 (PDF)', given: 'DGP binder — week 2' }],
          ['Reading Selection Gr4 Week 3', 'done', { posted: 'Jun 27', due: 'Jul 1', material: 'Reading Selection Gr4 W3 (PDF)', given: 'Reading folder — sel. 3' }],
        ],
        Homework: [
          ['Grammar Gr4 practice B', 'notdone', { posted: 'Jul 1', due: 'Jul 6', material: 'Grammar practice B (PDF)', given: 'Grammar binder — set B' }],
        ],
      },
      Math: {
        Classwork: [
          ['Multiplication D2-5', 'done', { posted: 'Jun 25', due: 'Jun 29', material: 'Multiplication D2-5 (PDF)', given: 'Math workbook D — p.9' }],
        ],
      },
    },
  },
  {
    name: 'Samarth M', grade: 'Gr8',
    work: {
      English: {
        Classwork: [
          ['Critical Reading Gr8 U2', 'notdone', { posted: 'Jun 29', due: 'Jul 3', material: 'Critical Reading U2 (PDF)', given: 'Reading book — unit 2' }],
        ],
        'To Be Graded': [
          ['DGP Gr 8 week 3', 'done', { posted: 'Jun 24', due: 'Jun 28', material: 'DGP Guide Gr8 (PDF)', given: 'DGP binder — week 3' }],
        ],
        Graded: [
          ['Vocabulary Gr8 set 4', 'done', { posted: 'Jun 16', due: 'Jun 20', material: 'Vocabulary set 4 (PDF)', given: 'Vocab notebook' }],
        ],
      },
      Math: {
        Classwork: [
          ['Algebra 3-2', 'fic', { posted: 'Jun 26', due: 'Jun 30', fixBy: 'Jul 3', material: 'Algebra 3-2 (PDF)', given: 'Algebra workbook 3 — p.2' }],
        ],
      },
    },
  },
  {
    name: 'Anushka Anoop', grade: 'Gr6',
    work: {
      English: {
        Classwork: [
          ['Reading Selection Gr6 Week 2', 'done', { posted: 'Jun 20', due: 'Jun 24', material: 'Reading Selection Gr6 W2 (PDF)', given: 'Reading folder — sel. 2' }],
          ['DGP Gr 6 week 2', 'notdone', { posted: 'Jun 30', due: 'Jul 4', material: 'DGP Guide Gr6 (PDF)', given: 'DGP binder — week 2' }],
        ],
      },
      Math: {
        Homework: [
          ['Ratios F-1', 'fic', { posted: 'Jun 27', due: 'Jul 1', fixBy: 'Jul 4', material: 'Ratios F-1 (PDF)', given: 'Math workbook F — p.1' }],
        ],
      },
    },
  },
  {
    name: 'Akshadha Anoop', grade: 'Gr8',
    work: {
      English: {
        Classwork: [
          ['Critical Reading Gr8 U3', 'done', { posted: 'Jun 28', due: 'Jul 2', material: 'Critical Reading U3 (PDF)', given: 'Reading book — unit 3' }],
        ],
        Homework: [
          ['Essay: persuasive techniques', 'notdone', { posted: 'Jul 1', due: 'Jul 7', material: 'Essay prompt (Doc)', given: 'Writing notebook' }],
        ],
      },
    },
  },
  {
    name: 'Liam Kim', grade: 'Gr2',
    work: {
      English: {
        Classwork: [
          ['Phonics Gr2 unit 5', 'done', { posted: 'Jun 25', due: 'Jun 29', material: 'Phonics unit 5 (PDF)', given: 'Phonics book — u.5' }],
          ['Sight Words set 3', 'fic', { posted: 'Jun 26', due: 'Jun 30', fixBy: 'Jul 2', material: 'Sight Words set 3 (PDF)', given: 'Sight words cards' }],
        ],
      },
      Math: {
        Classwork: [
          ['Number Sense B-2', 'done', { posted: 'Jun 24', due: 'Jun 28', material: 'Number Sense B-2 (PDF)', given: 'Math workbook B — p.6' }],
        ],
      },
    },
  },
  {
    name: 'Ananya Challa', grade: 'Gr9',
    work: {
      English: {
        'To Be Graded': [
          ['Literary Analysis Gr9 U1', 'done', { posted: 'Jun 24', due: 'Jun 30', material: 'Literary Analysis U1 (PDF)', given: 'Analysis notebook' }],
        ],
        Homework: [
          ['DGP Gr 9 week 2', 'notdone', { posted: 'Jul 1', due: 'Jul 6', material: 'DGP Guide Gr9 (PDF)', given: 'DGP binder — week 2' }],
        ],
      },
    },
  },
  {
    name: 'Rida K', grade: 'Gr2',
    work: {
      English: {
        Classwork: [
          ['Phonics Gr2 unit 4', 'done', { posted: 'Jun 20', due: 'Jun 24', material: 'Phonics unit 4 (PDF)', given: 'Phonics book — u.4' }],
          ['Reading Selection Gr2 Week 3', 'fic', { posted: 'Jun 27', due: 'Jul 1', fixBy: 'Jul 3', material: 'Reading Selection Gr2 W3 (PDF)', given: 'Reading folder — sel. 3' }],
        ],
      },
    },
  },
  {
    name: 'Mehar Kaur', grade: 'Gr4',
    work: {
      English: {
        Classwork: [
          ['DGP Gr 4 week 3', 'notdone', { posted: 'Jun 30', due: 'Jul 4', material: 'DGP Guide Gr4 (PDF)', given: 'DGP binder — week 3' }],
        ],
        Graded: [
          ['Root Words Gr 4 part 1', 'done', { posted: 'Jun 16', due: 'Jun 20', material: 'RootWords LevelA book1 (PDF)', given: 'Root Words notebook — p.4' }],
        ],
      },
      Math: {
        Classwork: [
          ['Fractions D-1', 'fic', { posted: 'Jun 26', due: 'Jun 30', fixBy: 'Jul 2', material: 'Fractions D-1 (PDF)', given: 'Math workbook D — p.14' }],
        ],
      },
    },
  },
  {
    name: 'Jonathan Liu', grade: 'Gr9',
    work: {
      English: {
        Homework: [
          ['Essay: comparative literature', 'done', { posted: 'Jun 28', due: 'Jul 3', material: 'Essay prompt (Doc)', given: 'Writing notebook' }],
        ],
      },
      Math: {
        Classwork: [
          ['Algebra 4-1', 'notdone', { posted: 'Jul 1', due: 'Jul 5', material: 'Algebra 4-1 (PDF)', given: 'Algebra workbook 4 — p.1' }],
        ],
      },
    },
  },
  {
    name: 'Sriharish S', grade: 'Gr3',
    work: {
      English: {
        Classwork: [
          ['Reading Selection Gr3 Week 2', 'done', { posted: 'Jun 20', due: 'Jun 24', material: 'Reading Selection Gr3 W2 (PDF)', given: 'Reading folder — sel. 2' }],
          ['DGP Gr 3 week 2', 'fic', { posted: 'Jun 26', due: 'Jun 30', fixBy: 'Jul 2', material: 'DGP Guide Gr3 (PDF)', given: 'DGP binder — week 2' }],
        ],
      },
    },
  },
  {
    name: 'Shahzain D', grade: 'Gr5',
    work: {
      English: {
        Classwork: [
          ['Root Words Gr 5 part 2', 'done', { posted: 'Jun 24', due: 'Jun 27', material: 'RootWords LevelA book2 (PDF)', given: 'Root Words notebook — p.14' }],
        ],
        Homework: [
          ['Gr5 Grammar Binder Week 2', 'notdone', { posted: 'Jul 1', due: 'Jul 6', material: 'Grammar Binder W2 (PDF)', given: 'Grammar binder — wk 2' }],
        ],
      },
    },
  },
  {
    name: 'Gowri M', grade: 'Gr6',
    work: {
      Math: {
        Classwork: [
          ['Ratios F-2', 'done', { posted: 'Jun 25', due: 'Jun 29', material: 'Ratios F-2 (PDF)', given: 'Math workbook F — p.4' }],
        ],
      },
      English: {
        Classwork: [
          ['DGP Gr 6 week 3', 'fic', { posted: 'Jun 27', due: 'Jul 1', fixBy: 'Jul 4', material: 'DGP Guide Gr6 (PDF)', given: 'DGP binder — week 3' }],
        ],
      },
    },
  },
  {
    name: 'Shanyza Roy', grade: 'Gr4',
    work: {
      English: {
        Classwork: [
          ['Reading Selection Gr4 Week 3', 'notdone', { posted: 'Jun 30', due: 'Jul 4', material: 'Reading Selection Gr4 W3 (PDF)', given: 'Reading folder — sel. 3' }],
        ],
      },
    },
  },
]

const TOPIC_ORDER = ['Classwork', 'To Be Graded', 'Homework', 'Graded', 'Drafts']
const SUBJECT_ORDER = ['English', 'Math']

// Expand the compact authoring format into the flat shape the UI/API contract uses.
function expand() {
  return STUDENTS.map((s, si) => {
    const items = []
    for (const subject of SUBJECT_ORDER) {
      const topics = s.work[subject]
      if (!topics) continue
      for (const topic of TOPIC_ORDER) {
        const list = topics[topic]
        if (!list) continue
        list.forEach(([title, status, x], ii) => {
          items.push({
            id: `${si}|${subject}|${topic}|${ii}`,
            subject,
            topic,
            title,
            status, // 'done' | 'fic' | 'notdone'
            posted: x.posted || '',
            due: x.due || '',
            fixBy: x.fixBy || null,
            material: x.material || '', // assigned (Classroom coursework)
            given: x.given || '',       // physical notebook (assignment header)
          })
        })
      }
    }
    return { id: `stu-${si}`, name: s.name, grade: s.grade, items }
  })
}

const DATA = expand()

export function getStudents() {
  return DATA.map(({ id, name, grade, items }) => ({
    id, name, grade,
    counts: summarize(items),
  }))
}

export function getStudentProgress(studentId) {
  const stu = DATA.find((s) => s.id === studentId)
  if (!stu) return null
  return {
    id: stu.id,
    name: stu.name,
    grade: stu.grade,
    counts: summarize(stu.items),
    items: stu.items,
  }
}

function summarize(items) {
  return {
    done: items.filter((i) => i.status === 'done').length,
    fic: items.filter((i) => i.status === 'fic').length,
    notdone: items.filter((i) => i.status === 'notdone').length,
  }
}

export { TOPIC_ORDER, SUBJECT_ORDER }
