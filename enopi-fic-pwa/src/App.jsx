import React, { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronRight, X, Smartphone, Tablet } from 'lucide-react'
import { getStudents, getStudentProgress } from './data/dataSource'
import { TEACHERS, SLOTS, rosterFor } from './data/schedule'
import { STATUS, subjectItems, todo, sessions, grid } from './data/progress'

const SUBJECTS = ['Math', 'English']
const ROOM_LABEL = { Math: 'Maths room', English: 'English room' }

export default function App() {
  const [device, setDevice] = useState('mobile')
  const [data, setData] = useState(null) // { [name]: { id, name, grade, items } }

  useEffect(() => {
    getStudents().then(async (list) => {
      const entries = await Promise.all(
        list.map(async (s) => [s.name, { ...s, ...(await getStudentProgress(s.id)) }])
      )
      setData(Object.fromEntries(entries))
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-4 py-3">
        <span className="text-sm font-medium text-gray-500">Enopi progress · demo</span>
        <div className="flex gap-1 bg-white rounded-lg border border-gray-300 p-0.5">
          <button onClick={() => setDevice('mobile')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${device === 'mobile' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
          <button onClick={() => setDevice('tablet')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${device === 'tablet' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
            <Tablet className="w-3.5 h-3.5" /> Tablet
          </button>
        </div>
      </div>

      <div className="flex justify-center pb-10 px-4">
        <div className={`bg-gray-50 border border-gray-300 rounded-[22px] shadow-sm overflow-hidden ${device === 'mobile' ? 'w-[390px]' : 'w-full max-w-[860px]'}`}>
          {data ? <Session device={device} data={data} /> : <div className="p-10 text-center text-sm text-gray-400">Loading…</div>}
        </div>
      </div>
    </div>
  )
}

function Session({ device, data }) {
  const [subject, setSubject] = useState('Math')
  const [teacher, setTeacher] = useState(TEACHERS[0])
  const [slot, setSlot] = useState('4:00')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)   // inline dropdown
  const [viewId, setViewId] = useState(null)    // progress modal

  const roster = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return Object.values(data).filter((s) => s.name.toLowerCase().includes(q))
    return rosterFor(teacher, slot).map((name) => data[name]).filter(Boolean)
  }, [data, teacher, slot, query])

  const pad = device === 'mobile' ? 'p-4' : 'p-6'

  return (
    <div className={pad}>
      <h1 className="text-lg font-semibold">Session view</h1>

      <div className="mt-3 flex gap-2">
        {SUBJECTS.map((s) => (
          <button key={s} onClick={() => setSubject(s)}
            className={`flex-1 text-sm rounded-lg px-3 py-2 border ${subject === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
            {ROOM_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {TEACHERS.map((t) => (
          <button key={t} onClick={() => { setTeacher(t); setOpenId(null) }}
            className={`flex-1 text-sm rounded-lg px-3 py-2 border ${teacher === t ? 'bg-gray-200 border-gray-400 font-medium' : 'bg-white text-gray-600 border-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2">
        {SLOTS.map((s) => (
          <button key={s} onClick={() => { setSlot(s); setOpenId(null) }}
            className={`text-sm rounded-lg py-2 border ${slot === s ? 'bg-gray-200 border-gray-400 font-medium' : 'bg-white text-gray-600 border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search walk-in student…"
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gray-500" />
      </div>

      <div className={`mt-3 ${device === 'tablet' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
        {roster.map((s) => (
          <StudentRow key={s.id} student={s} subject={subject}
            open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            onView={() => setViewId(s.id)} />
        ))}
        {roster.length === 0 && <p className="text-center text-sm text-gray-400 py-8 col-span-2">No students here — search for a walk-in.</p>}
      </div>

      {viewId && <ProgressModal device={device} student={data[Object.keys(data).find((n) => data[n].id === viewId)]} subject={subject} onClose={() => setViewId(null)} />}
    </div>
  )
}

function StudentRow({ student, subject, open, onToggle, onView }) {
  const items = subjectItems(student.items, subject)
  const list = todo(items)
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden self-start">
      <div className="flex items-center gap-2 px-3 py-3">
        <button onClick={onToggle} className="text-gray-400 shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="font-medium">{student.name}</span>
        <span className="text-xs text-gray-400">{student.grade}</span>
        {list.length > 0 && <span className="text-[11px] text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">{list.length} to do</span>}
        <button onClick={onView} className="ml-auto text-xs rounded-md px-2.5 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 shrink-0">
          View progress
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {list.length === 0 && <p className="text-xs text-gray-400 py-1">Nothing outstanding in {subject}.</p>}
          {list.map((it) => {
            const st = STATUS[it.status]
            return (
              <div key={it.id} className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                <span className="text-sm text-gray-800">{it.strand.label}</span>
                {it.level && <span className="text-xs text-gray-500">· {it.level}</span>}
                <span className={`ml-auto text-[11px] ${st.text}`}>
                  {it.status === 'fic' && it.fixBy ? `fix by ${it.fixBy}` : st.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProgressModal({ device, student, subject, onClose }) {
  const [subj, setSubj] = useState(subject)
  const items = subjectItems(student.items, subj)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-[720px]'} max-h-[85vh] overflow-auto p-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold">{student.name}</div>
            <div className="text-xs text-gray-400">{student.grade}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSubj(s)}
                  className={`text-xs px-3 py-1 rounded-md border ${subj === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {s === 'Math' ? 'maths' : 'english'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {items.length === 0
          ? <p className="text-sm text-gray-400 py-8 text-center">No {subj} work yet.</p>
          : device === 'mobile' ? <BySession items={items} /> : <GridView items={items} />}
      </div>
    </div>
  )
}

function LevelTag({ item }) {
  const st = STATUS[item.status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      <span className="text-[15px]">{item.level || item.strand.code}</span>
    </span>
  )
}

// Mobile — vertical, grouped by session date (the layout you liked).
function BySession({ items }) {
  return (
    <div className="mt-4">
      {sessions(items).map(({ date, entries }) => (
        <div key={date}>
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mt-3 mb-1.5 px-1">{date}</div>
          <div className="space-y-1.5">
            {entries.map((it) => (
              <div key={it.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                <span className="text-sm">{it.strand.label}</span>
                <LevelTag item={it} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Tablet — the full grid: dates × strands.
function GridView({ items }) {
  const g = grid(items)
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="border-collapse w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 px-3 border-b border-gray-300 font-medium whitespace-nowrap">Date</th>
            {g.strands.map((s) => (
              <th key={s.code} className="py-2 px-3 border-b border-gray-300 font-medium whitespace-nowrap">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {g.dates.map((d) => (
            <tr key={d}>
              <td className="py-3 px-3 border-b border-gray-200 text-gray-500 whitespace-nowrap border-r border-gray-300">{d}</td>
              {g.strands.map((s) => {
                const it = g.get(d, s.code)
                return (
                  <td key={s.code} className="py-3 px-3 border-b border-gray-200 border-r border-gray-100 text-center">
                    {it ? <LevelTag item={it} /> : <span className="text-gray-300">—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
