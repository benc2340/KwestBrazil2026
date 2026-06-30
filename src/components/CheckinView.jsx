import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CheckinView({ session }) {
  const [sessions, setSessions] = useState([])
  const [members, setMembers] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)

  useEffect(() => {
    load()
    const channel = supabase
      .channel('checkin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_responses' }, () => loadResponses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_sessions' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (activeSession) loadResponses()
  }, [activeSession])

  async function load() {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from('checkin_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('trip_members').select('name').order('joined_at'),
    ])
    setSessions(s || [])
    setMembers(m || [])
    const active = (s || []).find(x => x.active)
    setActiveSession(active || null)
    setLoading(false)
  }

  async function loadResponses() {
    if (!activeSession) return
    const { data } = await supabase.from('checkin_responses').select('*').eq('session_id', activeSession.id)
    setResponses(data || [])
    setHasCheckedIn(!!(data || []).find(r => r.member_name === session.name))
  }

  async function startCheckin() {
    if (!title.trim()) return
    setCreating(true)
    // Close any existing active session
    await supabase.from('checkin_sessions').update({ active: false }).eq('active', true)
    await supabase.from('checkin_sessions').insert({ title: title.trim(), created_by: session.name, active: true })
    setTitle('')
    setCreating(false)
    load()
  }

  async function closeCheckin() {
    if (!activeSession) return
    if (!confirm('Close this check-in?')) return
    await supabase.from('checkin_sessions').update({ active: false }).eq('id', activeSession.id)
    load()
  }

  async function checkIn() {
    if (!activeSession || hasCheckedIn) return
    await supabase.from('checkin_responses').insert({ session_id: activeSession.id, member_name: session.name })
    setHasCheckedIn(true)
    loadResponses()
  }

  if (loading) return <div className="h-full flex items-center justify-center text-ink/40">Loading…</div>

  const checkedIn = responses.map(r => r.member_name)
  const noResponse = members.map(m => m.name).filter(n => !checkedIn.includes(n))

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Leader: start check-in */}
      {session.isLeader && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="font-semibold text-ink text-sm mb-2">Start a Check-in</p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='e.g. "All on the bus?"'
            className="w-full px-4 py-2.5 rounded-xl border border-ink/15 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-clay"
          />
          <div className="flex gap-2">
            <button
              onClick={startCheckin}
              disabled={creating || !title.trim()}
              className="flex-1 bg-canopy text-sand font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {creating ? 'Starting…' : 'Start Check-in'}
            </button>
            {activeSession && (
              <button onClick={closeCheckin} className="px-4 py-2.5 rounded-xl border border-clay/30 text-clay text-sm font-medium">
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active check-in */}
      {activeSession ? (
        <div>
          <div className="bg-dusk rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-sand/60 text-xs font-semibold uppercase tracking-widest">Active Check-in</p>
            </div>
            <p className="font-display text-lg text-sand font-semibold mb-3">"{activeSession.title}"</p>
            {!hasCheckedIn ? (
              <button
                onClick={checkIn}
                className="w-full font-bold py-3 rounded-xl text-dusk text-base"
                style={{ background: 'linear-gradient(135deg, #FFDF00, #FFB800)' }}
              >
                ✓ I'm here!
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-green-500/20 text-green-300 font-semibold text-center text-sm">
                ✓ Checked in!
              </div>
            )}
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-green-600 text-xs font-semibold uppercase tracking-widest mb-2">
                ✓ Here ({checkedIn.length})
              </p>
              <div className="space-y-1.5">
                {checkedIn.map(name => (
                  <p key={name} className="text-ink text-xs font-medium truncate">{name}</p>
                ))}
                {checkedIn.length === 0 && <p className="text-ink/30 text-xs">None yet</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-clay text-xs font-semibold uppercase tracking-widest mb-2">
                ? No response ({noResponse.length})
              </p>
              <div className="space-y-1.5">
                {noResponse.map(name => (
                  <p key={name} className="text-ink/50 text-xs truncate">{name}</p>
                ))}
                {noResponse.length === 0 && <p className="text-green-600 text-xs font-medium">Everyone's in! 🎉</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-semibold text-ink mb-1">No active check-in</p>
          <p className="text-ink/40 text-sm">
            {session.isLeader ? 'Start one above when you need a headcount.' : 'Your leader will start one when needed.'}
          </p>
        </div>
      )}

      {/* Past check-ins */}
      {sessions.filter(s => !s.active).length > 0 && (
        <div className="mt-4">
          <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-2">Past Check-ins</p>
          <div className="space-y-2">
            {sessions.filter(s => !s.active).map(s => (
              <div key={s.id} className="bg-white/60 rounded-2xl px-4 py-3 flex justify-between items-center">
                <p className="text-ink/60 text-sm">"{s.title}"</p>
                <p className="text-ink/30 text-xs">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
