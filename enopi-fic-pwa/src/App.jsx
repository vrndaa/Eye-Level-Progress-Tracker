import React, { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronRight, X, Plus, Smartphone, Tablet } from 'lucide-react'
import { getStudents, getStudentProgress } from './data/dataSource'
import { SLOTS, teachersFor, rosterFor } from './data/schedule'
import { subjectItems, todo, sessions, grid, isOverdue } from './data/progress'

const SUBJECTS = ['English', 'Math']
const ROOM_LABEL = { English: 'English Room', Math: 'Maths Room' }

export default function App() {
  const [device, setDevice] = useState('tablet')
  const [data, setData] = useState(null)

  useEffect(() => {
    getStudents().then(async (list) => {
      const entries = await Promise.all(
        list.map(async (s) => [s.name, { ...s, ...(await getStudentProgress(s.id)) }])
      )
      setData(Object.fromEntries(entries))
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">Eye Level Progress Tracker</span>
        <div className="flex gap-1 bg-white rounded-lg border-[0.5px] border-black p-0.5">
          <button onClick={() => setDevice('mobile')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${device === 'mobile' ? 'bg-[#FDD776] text-gray-900' : 'text-gray-600'}`}>
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
          <button onClick={() => setDevice('tablet')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${device === 'tablet' ? 'bg-[#FDD776] text-gray-900' : 'text-gray-600'}`}>
            <Tablet className="w-3.5 h-3.5" /> Tablet
          </button>
        </div>
      </div>
      <div className="flex justify-center pb-12 px-4">
        <div className={device === 'mobile' ? 'w-[390px]' : 'w-full max-w-[900px]'}>
          {data ? <Session device={device} data={data} /> : <div className="p-10 text-center text-sm text-gray-400">Loading…</div>}
        </div>
      </div>
    </div>
  )
}

function Session({ device, data }) {
  const [subject, setSubject] = useState('English')
  const [teacher, setTeacher] = useState(teachersFor('English')[0])
  const [slot, setSlot] = useState('4:00pm')
  const [query, setQuery] = useState('')
  const [walkins, setWalkins] = useState([]) // students added to this group on the fly
  const [openId, setOpenId] = useState(null)
  const [viewId, setViewId] = useState(null)

  const teachers = teachersFor(subject)

  // Changing the group resets who's in it (and any walk-ins added to the previous group).
  const resetGroup = () => { setOpenId(null); setWalkins([]); setQuery('') }
  const pickSubject = (s) => { setSubject(s); setTeacher(teachersFor(s)[0]); resetGroup() }
  const pickTeacher = (t) => { setTeacher(t); resetGroup() }
  const pickSlot = (s) => { setSlot(s); resetGroup() }

  // The group = scheduled students for this slot + any walk-ins added.
  const names = useMemo(() => {
    const scheduled = rosterFor(subject, teacher, slot)
    return [...scheduled, ...walkins.filter((n) => !scheduled.includes(n))]
  }, [subject, teacher, slot, walkins])
  const roster = names.map((n) => data[n]).filter(Boolean)
  const scheduledSet = useMemo(() => new Set(rosterFor(subject, teacher, slot)), [subject, teacher, slot])

  // Search matches ANY student not already in the group — pick one to add as a walk-in.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return Object.values(data)
      .filter((s) => s.name.toLowerCase().includes(q) && !names.includes(s.name))
      .slice(0, 6)
  }, [data, query, names])

  const addWalkin = (name) => { setWalkins((w) => [...w, name]); setQuery('') }
  const removeWalkin = (name) => setWalkins((w) => w.filter((n) => n !== name))

  const Toggle = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`text-sm rounded-lg px-3 py-3 font-medium border-[0.5px] border-black transition-colors ${active
        ? 'bg-[#FDD776] text-gray-900'
        : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
      {children}
    </button>
  )

  return (
    <div className="space-y-3">
      {/* Controls card */}
      <div className="bg-white rounded-2xl border-[1.5px] border-black p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map((s) => <Toggle key={s} active={subject === s} onClick={() => pickSubject(s)}>{ROOM_LABEL[s]}</Toggle>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {teachers.map((t) => <Toggle key={t} active={teacher === t} onClick={() => pickTeacher(t)}>{t}</Toggle>)}
        </div>
        <div className={`grid ${device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
          {SLOTS.map((s) => <Toggle key={s} active={slot === s} onClick={() => pickSlot(s)}>{s}</Toggle>)}
        </div>
      </div>

      {/* Roster card */}
      <div className="bg-white rounded-2xl border-[1.5px] border-black p-4">
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add a walk-in student…"
            className="w-full rounded-lg bg-gray-50 border-[0.5px] border-black pl-9 pr-3 py-3 text-sm outline-none focus:bg-white" />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border-[0.5px] border-black overflow-hidden">
              {results.map((s) => (
                <button key={s.id} onClick={() => addWalkin(s.name)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f5ecd8]">
                  <Plus className="w-4 h-4 text-[#b8923c] shrink-0" />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.grade}</span>
                  <span className="ml-auto text-xs text-gray-400">Add to group</span>
                </button>
              ))}
            </div>
          )}
          {query.trim() && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border-[0.5px] border-black px-3 py-2.5 text-sm text-gray-400">
              No match — or already in this group.
            </div>
          )}
        </div>

        {roster.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No students here — search to add a walk-in.</p>
        ) : device === 'mobile' ? (
          <div className="space-y-3">
            {roster.map((s) => (
              <StudentCard key={s.id} student={s} subject={subject} walkin={!scheduledSet.has(s.name)}
                open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                onView={() => setViewId(s.id)} onRemove={() => removeWalkin(s.name)} />
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {roster.map((s) => (
              <div key={s.id} className="mb-3 break-inside-avoid">
                <StudentCard student={s} subject={subject} walkin={!scheduledSet.has(s.name)}
                  open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                  onView={() => setViewId(s.id)} onRemove={() => removeWalkin(s.name)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {viewId && <ProgressModal device={device} student={Object.values(data).find((s) => s.id === viewId)} subject={subject} onClose={() => setViewId(null)} />}
    </div>
  )
}

function StudentCard({ student, subject, walkin, open, onToggle, onView, onRemove }) {
  const items = subjectItems(student.items, subject)
  const list = todo(items)
  const [details, setDetails] = useState({})

  return (
    <div className={`rounded-xl p-3 self-start border-[0.5px] border-black ${walkin ? 'bg-[#f7efdd]' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="text-gray-500 shrink-0">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <span className="text-lg font-semibold">{student.name}</span>
        <span className="text-xs text-gray-400">{student.grade}</span>
        {walkin && <span className="text-[10px] font-medium text-[#8a6d2b] bg-[#ecdcb0] rounded px-1.5 py-0.5">walk-in</span>}
        {walkin && (
          <button onClick={onRemove} title="Remove walk-in" className="text-[#b8923c] hover:text-[#8a6d2b] shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={onView} className="ml-auto text-xs rounded-md px-1.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 shrink-0">
          View Progress
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {list.length === 0 && <p className="text-xs text-gray-500 px-1 py-2">Nothing outstanding in {subject}.</p>}
          {list.map((it) => {
            const showDetails = details[it.id]
            const overdue = it.status === 'notdone' && isOverdue(it.due)
            return (
              <div key={it.id} className="bg-white rounded-lg">
                <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2">{it.topic}</div>
                <div className="flex items-center gap-2 px-3 pb-2">
                  <span className="text-sm font-semibold w-16 shrink-0">{it.strand.code}</span>
                  <span className="text-xs text-gray-600 truncate">{it.level}{it.detail ? ` · ${it.detail}` : ''}</span>
                  <button onClick={() => setDetails((d) => ({ ...d, [it.id]: !d[it.id] }))}
                    className="ml-auto text-xs rounded-md px-2 py-1 border border-gray-300 hover:bg-gray-50 shrink-0">
                    Details
                  </button>
                </div>
                {showDetails && (
                  <div className="mx-2 mb-2 rounded-lg border border-gray-200 p-2.5">
                    <div className="text-[11px] text-gray-500">
                      Assigned {it.posted}{(it.due || it.fixBy) && <> · Due {it.due || it.fixBy}</>}
                      {overdue && <span className="text-red-600 font-medium"> · past due</span>}
                    </div>
                  </div>
                )}
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
      <div className={`bg-white rounded-2xl border-[1.5px] border-black w-full ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-[760px]'} max-h-[86vh] overflow-auto p-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold">{student.name}</div>
            <div className="text-xs text-gray-400">{student.grade} · progress</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSubj(s)}
                  className={`text-xs px-3 py-1 rounded-md border-[0.5px] border-black ${subj === s ? 'bg-[#FDD776] text-gray-900' : 'bg-white text-gray-600'}`}>
                  {s === 'Math' ? 'maths' : 'english'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex gap-4 mt-3 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> done</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block" /> not done</span>
        </div>

        {items.length === 0
          ? <p className="text-sm text-gray-400 py-8 text-center">No {subj} work yet.</p>
          : device === 'mobile' ? <BySession items={items} /> : <GridView items={items} />}
      </div>
    </div>
  )
}

// Greyscale cell: gray block = done, white block = not done (with due date).
function Cell({ item }) {
  if (!item) return <span className="text-gray-300">·</span>
  const done = item.status === 'done' || item.status === 'submitted'
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-gray-200 text-gray-700 px-2 py-0.5 text-sm">
        {item.level || item.strand.code}
        {item.wasFic && <span className="text-[9px] text-gray-500">fic✓</span>}
      </span>
    )
  }
  // not done / fic — white block, show due or fix-by underneath. FIC gets a red stroke.
  const isFic = item.status === 'fic'
  const note = isFic ? `fix ${item.fixBy || ''}` : isOverdue(item.due) ? `past due ${item.due}` : item.due ? `due ${item.due}` : ''
  return (
    <span className="inline-flex flex-col items-center">
      <span className={`rounded bg-white border text-gray-900 px-2 py-0.5 text-sm ${isFic ? 'border-[#ED3434]' : 'border-gray-400'}`}>{item.level || item.strand.code}</span>
      {note && <span className="text-[9px] text-gray-500 mt-0.5">{note}</span>}
    </span>
  )
}

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
                <Cell item={it} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GridView({ items }) {
  const g = grid(items)
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="border-collapse w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 px-3 border-b border-gray-300 font-medium whitespace-nowrap sticky left-0 bg-white">Date</th>
            {g.strands.map((s) => (
              <th key={s.code} className="py-2 px-3 border-b border-gray-300 font-medium whitespace-nowrap">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {g.dates.map((d) => (
            <tr key={d}>
              <td className="py-2.5 px-3 border-b border-gray-100 text-gray-500 whitespace-nowrap border-r border-gray-200 sticky left-0 bg-white">{d}</td>
              {g.strands.map((s) => (
                <td key={s.code} className="py-2.5 px-3 border-b border-gray-100 text-center">
                  <Cell item={g.get(d, s.code)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
