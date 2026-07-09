import React, { useEffect, useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, FileText, BookOpen } from 'lucide-react'
import { getStudents, getStudentProgress, TOPIC_ORDER, SUBJECT_ORDER } from './data/dataSource'

// Status → color styling. One place so the dots, badges and text stay consistent.
const STATUS = {
  done:    { label: 'Done',     dot: 'bg-green-500',  chip: 'bg-green-100 text-green-700',   text: 'text-green-700' },
  fic:     { label: 'FIC',      dot: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  notdone: { label: 'Not done', dot: 'bg-red-500',    chip: 'bg-red-100 text-red-700',       text: 'text-red-700' },
}

export default function App() {
  const [students, setStudents] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => { getStudents().then(setStudents) }, [])

  if (!students) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-md mx-auto p-4">
        {selectedId
          ? <StudentProgress studentId={selectedId} onBack={() => setSelectedId(null)} />
          : <Home students={students} onSelect={setSelectedId} />}
      </div>
    </div>
  )
}

function Home({ students, onSelect }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return students
    return students.filter((s) => s.name.toLowerCase().includes(t) || s.grade.toLowerCase().includes(t))
  }, [q, students])

  return (
    <>
      <h1 className="text-xl font-semibold">Student progress</h1>
      <p className="text-sm text-gray-500 mt-0.5">Search any student — scheduled, make-up or walk-in.</p>

      <div className="mt-3 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or grade…"
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gray-500"
        />
      </div>

      <div className="mt-3 space-y-2">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left hover:bg-gray-50"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-sm font-medium text-gray-600 shrink-0">
              {s.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="font-medium block truncate">{s.name}</span>
              <span className="text-xs text-gray-400">{s.grade}</span>
            </span>
            <span className="ml-auto flex items-center gap-1.5 shrink-0">
              {s.counts.fic > 0 && <Count n={s.counts.fic} kind="fic" />}
              {s.counts.notdone > 0 && <Count n={s.counts.notdone} kind="notdone" />}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No students match “{q}”.</p>}
      </div>
    </>
  )
}

function Count({ n, kind }) {
  const s = STATUS[kind]
  return (
    <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {n} {s.label}
    </span>
  )
}

function StudentProgress({ studentId, onBack }) {
  const [data, setData] = useState(null)
  useEffect(() => { getStudentProgress(studentId).then(setData) }, [studentId])

  if (!data) return <p className="text-sm text-gray-400 py-8">Loading…</p>

  // Group items by subject → topic in the intended display order.
  const groups = []
  for (const subject of SUBJECT_ORDER) {
    const subjectItems = data.items.filter((i) => i.subject === subject)
    if (subjectItems.length === 0) continue
    const topics = []
    for (const topic of TOPIC_ORDER) {
      const items = subjectItems.filter((i) => i.topic === topic)
      if (items.length) topics.push({ topic, items })
    }
    groups.push({ subject, topics })
  }

  return (
    <>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft className="w-4 h-4" /> All students
      </button>

      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <span className="text-sm text-gray-400">{data.grade}</span>
      </div>

      {/* Summary strip */}
      <div className="mt-3 flex gap-2">
        <Summary n={data.counts.done} kind="done" />
        <Summary n={data.counts.fic} kind="fic" />
        <Summary n={data.counts.notdone} kind="notdone" />
      </div>

      {groups.map((g) => (
        <div key={g.subject} className="mt-5">
          <h2 className="text-sm font-semibold text-gray-700">{g.subject}</h2>
          {g.topics.map((t) => (
            <div key={t.topic} className="mt-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">{t.topic}</p>
              <div className="mt-1 space-y-1.5">
                {t.items.map((item) => <ItemRow key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

function Summary({ n, kind }) {
  const s = STATUS[kind]
  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
      <div className={`text-lg font-semibold ${s.text}`}>{n}</div>
      <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
      </div>
    </div>
  )
}

function ItemRow({ item }) {
  const s = STATUS[item.status]
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} title={s.label} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{item.title}</span>
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 whitespace-nowrap shrink-0 ml-auto ${s.chip}`}>{s.label}</span>
          </div>

          {item.status === 'fic' && item.fixBy && (
            <p className="text-xs text-orange-700 mt-0.5">Return / fix by {item.fixBy}</p>
          )}

          {/* Given vs assigned — the distinction the teachers asked for */}
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-400">Assigned:</span> {item.material}
            </p>
            {item.given && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="text-gray-400">Given:</span> {item.given}
              </p>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-1">
            {item.posted && <>Posted {item.posted}</>}
            {item.due && <> · Due {item.due}</>}
          </p>
        </div>
      </div>
    </div>
  )
}
