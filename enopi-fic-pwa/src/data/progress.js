// PROGRESS HELPERS — turn Classroom items into the strands/levels/sessions the UI shows.

// Map an assignment title to its curriculum strand (label for display, code for the grid).
const STRAND_MAP = [
  [/reading selection|\bselection\b/i, 'Reading selection', 'RS'],
  [/root words/i, 'Root words', 'RW'],
  [/\bdgp\b/i, 'DGP', 'DGP'],
  [/grammar/i, 'Grammar', 'GR'],
  [/classic series|comprehension|critical reading/i, 'Comprehension', 'Comp'],
  [/vocab/i, 'Vocabulary', 'Vocab'],
  [/basic thinking/i, 'Basic thinking', 'BT'],
  [/critical thinking/i, 'Critical thinking', 'CT'],
  [/\blogic\b/i, 'Logic', 'Logic'],
  [/fraction/i, 'Fractions', 'Fr'],
  [/algebra/i, 'Algebra', 'Alg'],
  [/ratio/i, 'Ratios', 'Ratio'],
  [/multiplication/i, 'Multiplication', 'Mult'],
  [/number sense/i, 'Number sense', 'NS'],
]

export function parseStrand(title) {
  for (const [re, label, code] of STRAND_MAP) if (re.test(title)) return { label, code }
  return { label: title, code: title.slice(0, 8) }
}

// Pull a level/book token out of the title (D1-4, B2-11, E-3, part 2, week 1, set 4…).
export function parseLevel(title) {
  let m = title.match(/\b([A-Z]\d?-\d+)\b/)
  if (m) return m[1]
  m = title.match(/\bpart\s*(\d+)/i)
  if (m) return 'pt ' + m[1]
  m = title.match(/\bweek\s*(\d+)/i)
  if (m) return 'wk ' + m[1]
  m = title.match(/\bset\s*(\d+)/i)
  if (m) return 'set ' + m[1]
  m = title.match(/\bU\s*(\d+)/i)
  if (m) return 'U' + m[1]
  return ''
}

export const STATUS = {
  done:      { label: 'Done',        dot: 'bg-green-500',  text: 'text-green-600',  chipBg: 'bg-green-100',  chipText: 'text-green-700' },
  submitted: { label: 'Submitted',   dot: 'bg-sky-500',    text: 'text-sky-600',    chipBg: 'bg-sky-100',    chipText: 'text-sky-700' },
  fic:       { label: 'FIC',         dot: 'bg-orange-500', text: 'text-orange-600', chipBg: 'bg-orange-100', chipText: 'text-orange-700' },
  notdone:   { label: 'Not started', dot: 'bg-red-500',    text: 'text-red-600',    chipBg: 'bg-red-100',    chipText: 'text-red-700' },
}

// Items for one subject, decorated with strand + level.
export function subjectItems(items, subject) {
  return items
    .filter((i) => i.subject === subject)
    .map((i) => ({ ...i, strand: parseStrand(i.title), level: parseLevel(i.title) }))
}

// Not-done first, then FICs — the quick "what to work on" list.
export function todo(items) {
  const order = { notdone: 0, fic: 1 }
  return items
    .filter((i) => i.status === 'notdone' || i.status === 'fic')
    .sort((a, b) => order[a.status] - order[b.status])
}

// Group by session date, newest first — the mobile "by session" view.
export function sessions(items) {
  const byDate = new Map()
  for (const i of items) {
    if (!byDate.has(i.posted)) byDate.set(i.posted, [])
    byDate.get(i.posted).push(i)
  }
  return [...byDate.entries()].map(([date, entries]) => ({ date, entries }))
}

// Rows = dates, columns = strands, cell = level — the tablet grid.
export function grid(items) {
  const dates = [...new Set(items.map((i) => i.posted))]
  const strandOrder = []
  const seen = new Set()
  for (const i of items) if (!seen.has(i.strand.code)) { seen.add(i.strand.code); strandOrder.push(i.strand) }
  const cell = {}
  for (const i of items) cell[`${i.posted}|${i.strand.code}`] = i
  return { dates, strands: strandOrder, get: (d, code) => cell[`${d}|${code}`] || null }
}
