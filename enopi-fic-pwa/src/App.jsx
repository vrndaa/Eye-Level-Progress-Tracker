import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Check, RotateCcw, AlertCircle, ExternalLink } from 'lucide-react'
import { getSessions, clearFic, connect, SHEETS_ENABLED, SLOTS, TEACHERS, SESSION_DATE } from './data/dataSource'

export default function App() {
  const [sessions, setSessions] = useState(null)
  const [teacher, setTeacher] = useState(TEACHERS[0])
  const [slot, setSlot] = useState('4:00')
  const [open, setOpen] = useState({})
  // LIVE mode gates loading behind a Google sign-in; OFFLINE loads immediately.
  const [connected, setConnected] = useState(!SHEETS_ENABLED)
  const [connecting, setConnecting] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (connected) getSessions().then(setSessions)
  }, [connected])

  const handleConnect = async () => {
    setConnecting(true)
    setAuthError(null)
    try {
      await connect()
      setConnected(true)
    } catch (e) {
      setAuthError(e.message || 'Sign-in failed')
    } finally {
      setConnecting(false)
    }
  }

  if (SHEETS_ENABLED && !connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-gray-600">This session view reads and updates a live Google Sheet.</p>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="text-sm rounded-lg px-4 py-2 bg-gray-900 text-white disabled:opacity-50"
        >
          {connecting ? 'Connecting…' : 'Connect Google Sheets'}
        </button>
        {authError && <p className="text-xs text-red-600 max-w-xs">{authError}</p>}
      </div>
    )
  }

  if (!sessions) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading session…</div>
  }

  const current = sessions.find((s) => s.teacher === teacher && s.slot === slot)
  const roster = current ? current.students : []
  const outstanding = roster.reduce((n, s) => n + s.fics.filter((f) => !f.cleared).length, 0)

  const toggleClear = async (studentId, ficId) => {
    let nextCleared = false
    const flip = (value) => (prev) =>
      prev.map((sess) => ({
        ...sess,
        students: sess.students.map((st) =>
          st.id !== studentId ? st : {
            ...st,
            fics: st.fics.map((f) => (f.id !== ficId ? f : { ...f, cleared: value })),
          }
        ),
      }))
    // Optimistic update; revert if the live write-back fails.
    setSessions((prev) => {
      const target = prev
        .flatMap((s) => s.students)
        .find((st) => st.id === studentId)
        ?.fics.find((f) => f.id === ficId)
      nextCleared = target ? !target.cleared : true
      return flip(nextCleared)(prev)
    })
    try {
      await clearFic(ficId, nextCleared)
    } catch (e) {
      setSessions(flip(!nextCleared))
      console.error('Failed to write clear to sheet:', e)
      alert('Could not update the sheet — reverted. ' + (e.message || ''))
    }
  }

  const toggleOpen = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const reset = () => getSessions().then(setSessions)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Session view</h1>
          <span className="text-sm text-gray-500">{SESSION_DATE}</span>
        </div>

        <div className="mt-3 flex gap-2">
          {TEACHERS.map((t) => (
            <button
              key={t}
              onClick={() => setTeacher(t)}
              className={`flex-1 text-sm rounded-lg px-3 py-2 border ${
                teacher === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`text-sm rounded-lg py-2 border ${
                slot === s ? 'bg-gray-200 border-gray-400 font-medium' : 'bg-white border-gray-300 text-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{teacher}</span> · {slot} · {roster.length} students ·{' '}
          <span className="font-medium text-gray-900">{outstanding} outstanding</span>
        </div>

        <div className="mt-2 space-y-2">
          {roster.map((s) => {
            const isOpen = !!open[s.id]
            const openCount = s.fics.filter((f) => !f.cleared).length
            const done = s.fics.length > 0 && openCount === 0
            return (
              <div key={s.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => toggleOpen(s.id)} className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-gray-50">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.grade}</span>
                  {s.note && (
                    <span className="text-[10px] text-amber-600 inline-flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" />
                      {s.note}
                    </span>
                  )}
                  <span className="ml-auto shrink-0">
                    {s.unmatched ? (
                      <span className="text-xs text-gray-400">no FICs logged</span>
                    ) : done ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="w-3.5 h-3.5" /> clear</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">{openCount} open</span>
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {s.fics.length === 0 && <p className="text-xs text-gray-400 py-1">No FICs logged for this student.</p>}
                    {s.fics.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5">
                        <span className="text-xs rounded px-1.5 py-0.5 bg-white text-gray-700 border border-gray-300">Eng</span>
                        <span className={`text-sm ${f.cleared ? 'line-through text-gray-400' : 'text-gray-800'}`}>{f.code}</span>
                        {f.detail && (
                          <span className={`text-xs ${f.cleared ? 'text-gray-300' : 'text-gray-500'}`}>· {f.detail}</span>
                        )}
                        {!f.cleared && (
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            title="Deep-link to the Classroom assignment (wired in the live build)"
                            className="text-gray-300 hover:text-gray-500"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => toggleClear(s.id, f.id)}
                          className={`ml-auto text-xs rounded-md px-2 py-1 ${
                            f.cleared ? 'text-gray-500 hover:bg-gray-100' : 'text-white bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {f.cleared ? 'Undo' : 'Clear'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {roster.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No students in this slot.</p>}
        </div>

        <button onClick={reset} className="mt-4 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <RotateCcw className="w-3.5 h-3.5" /> Reset demo
        </button>
      </div>
    </div>
  )
}
