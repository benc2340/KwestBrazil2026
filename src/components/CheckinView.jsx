import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function getVoterToken() {
  let token = localStorage.getItem('kwest_voter_token')
  if (!token) { token = crypto.randomUUID(); localStorage.setItem('kwest_voter_token', token) }
  return token
}

export default function CheckinView({ session }) {
  const [subTab, setSubTab] = useState('checkin')

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        <button onClick={() => setSubTab('checkin')} className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'checkin' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          ✓ Check-in
        </button>
        <button onClick={() => setSubTab('polls')} className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'polls' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          📊 Polls
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {subTab === 'checkin' ? <CheckinTab session={session} /> : <PollsTab session={session} />}
      </div>
    </div>
  )
}

function CheckinTab({ session }) {
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
    const channel = supabase.channel('checkin_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_responses' }, () => loadResponses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_sessions' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => { if (activeSession) loadResponses() }, [activeSession])

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
    await supabase.from('checkin_sessions').update({ active: false }).eq('active', true)
    await supabase.from('checkin_sessions').insert({ title: title.trim(), created_by: session.name, active: true })
    setTitle('')
    setCreating(false)
    load()
  }

  async function closeCheckin() {
    if (!confirm('Close this check-in?')) return
    await supabase.from('checkin_sessions').update({ active: false }).eq('id', activeSession.id)
    load()
  }

  async function deleteSession(id) {
    if (!confirm('Delete this check-in?')) return
    await supabase.from('checkin_sessions').delete().eq('id', id)
    load()
  }

  async function checkIn() {
    if (!activeSession || hasCheckedIn) return
    await supabase.from('checkin_responses').insert({ session_id: activeSession.id, member_name: session.name })
    setHasCheckedIn(true)
    loadResponses()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-ink/40">Loading…</div>

  const checkedIn = responses.map(r => r.member_name)
  const noResponse = members.map(m => m.name).filter(n => !checkedIn.includes(n))

  return (
    <div className="h-full overflow-y-auto pb-6">
      {session.isLeader && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="font-semibold text-ink text-sm mb-2">Start a Check-in</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder='"All on the bus?"'
            className="w-full px-4 py-2.5 rounded-xl border border-ink/15 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-clay" />
          <div className="flex gap-2">
            <button onClick={startCheckin} disabled={creating || !title.trim()}
              className="flex-1 bg-canopy text-sand font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {creating ? 'Starting…' : 'Start Check-in'}
            </button>
            {activeSession && (
              <button onClick={closeCheckin} className="px-4 py-2.5 rounded-xl border border-clay/30 text-clay text-sm font-medium">Close</button>
            )}
          </div>
        </div>
      )}

      {activeSession ? (
        <div>
          <div className="bg-dusk rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-sand/60 text-xs font-semibold uppercase tracking-widest">Active Check-in</p>
            </div>
            <p className="font-display text-lg text-sand font-semibold mb-3">"{activeSession.title}"</p>
            {!hasCheckedIn ? (
              <button onClick={checkIn} className="w-full font-bold py-3 rounded-xl text-dusk text-base" style={{ background: 'linear-gradient(135deg, #FFDF00, #FFB800)' }}>
                ✓ I'm here!
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-green-500/20 text-green-300 font-semibold text-center text-sm">✓ Checked in!</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-green-600 text-xs font-semibold uppercase tracking-widest mb-2">✓ Here ({checkedIn.length})</p>
              <div className="space-y-1.5">{checkedIn.map(n => <p key={n} className="text-ink text-xs font-medium truncate">{n}</p>)}</div>
              {checkedIn.length === 0 && <p className="text-ink/30 text-xs">None yet</p>}
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-clay text-xs font-semibold uppercase tracking-widest mb-2">? No response ({noResponse.length})</p>
              <div className="space-y-1.5">{noResponse.map(n => <p key={n} className="text-ink/50 text-xs truncate">{n}</p>)}</div>
              {noResponse.length === 0 && <p className="text-green-600 text-xs font-medium">Everyone's in! 🎉</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-semibold text-ink mb-1">No active check-in</p>
          <p className="text-ink/40 text-sm">{session.isLeader ? 'Start one above.' : 'Your leader will start one when needed.'}</p>
        </div>
      )}

      {sessions.filter(s => !s.active).length > 0 && (
        <div className="mt-4">
          <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-2">Past Check-ins</p>
          <div className="space-y-2">
            {sessions.filter(s => !s.active).map(s => (
              <div key={s.id} className="bg-white/60 rounded-2xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-ink/60 text-sm">"{s.title}"</p>
                  <p className="text-ink/30 text-xs">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                {session.isLeader && (
                  <button onClick={() => deleteSession(s.id)} className="text-ink/20 hover:text-clay text-xl px-1">×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PollsTab({ session }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [creating, setCreating] = useState(false)
  const [votedPolls, setVotedPolls] = useState({}) // pollId -> optionIndex
  const voterToken = getVoterToken()

  useEffect(() => {
    load()
    const channel = supabase.channel('polls_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function load() {
    const { data: pollData } = await supabase.from('polls').select('*, poll_votes(*)').order('created_at', { ascending: false })
    setPolls(pollData || [])
    // Track my votes
    const { data: myVotes } = await supabase.from('poll_votes').select('poll_id, option_index').eq('voter_token', voterToken)
    if (myVotes) {
      const map = {}
      myVotes.forEach(v => { map[v.poll_id] = v.option_index })
      setVotedPolls(map)
    }
    setLoading(false)
  }

  async function createPoll() {
    const validOptions = options.filter(o => o.trim())
    if (!question.trim() || validOptions.length < 2) return
    setCreating(true)
    await supabase.from('polls').insert({ question: question.trim(), options: validOptions, created_by: session.name, active: true })
    setQuestion('')
    setOptions(['', ''])
    setCreating(false)
    load()
  }

  async function vote(pollId, optionIndex) {
    if (votedPolls[pollId] !== undefined) return
    await supabase.from('poll_votes').insert({ poll_id: pollId, option_index: optionIndex, voter_token: voterToken })
    setVotedPolls(prev => ({ ...prev, [pollId]: optionIndex }))
    load()
  }

  async function closePoll(id) {
    await supabase.from('polls').update({ active: false }).eq('id', id)
    load()
  }

  async function deletePoll(id) {
    if (!confirm('Delete this poll?')) return
    await supabase.from('polls').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-ink/40">Loading…</div>

  const active = polls.filter(p => p.active)
  const past = polls.filter(p => !p.active)

  return (
    <div className="h-full overflow-y-auto pb-6">
      {session.isLeader && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="font-semibold text-ink text-sm mb-2">Create a Poll</p>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Your question…"
            className="w-full px-4 py-2.5 rounded-xl border border-ink/15 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-clay" />
          {options.map((o, i) => (
            <input key={i} value={o} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }}
              placeholder={`Option ${i + 1}`}
              className="w-full px-4 py-2 rounded-xl border border-ink/15 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-clay" />
          ))}
          <div className="flex gap-2">
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ''])} className="text-xs text-dusk/60 font-medium">+ Add option</button>
            )}
            <button onClick={createPoll} disabled={creating}
              className="ml-auto bg-canopy text-sand px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {creating ? 'Creating…' : 'Post Poll'}
            </button>
          </div>
          <p className="text-ink/30 text-xs mt-2">🔒 Responses are anonymous</p>
        </div>
      )}

      {active.length === 0 && past.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-3xl mb-2">📊</p>
          <p className="font-semibold text-ink mb-1">No polls yet</p>
          <p className="text-ink/40 text-sm">{session.isLeader ? 'Create one above.' : 'Your leaders will post polls here.'}</p>
        </div>
      )}

      {active.map(poll => <PollCard key={poll.id} poll={poll} myVote={votedPolls[poll.id]} onVote={vote} onClose={session.isLeader ? closePoll : null} onDelete={session.isLeader ? deletePoll : null} />)}

      {past.length > 0 && (
        <div className="mt-4">
          <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-2">Closed Polls</p>
          {past.map(poll => <PollCard key={poll.id} poll={poll} myVote={votedPolls[poll.id]} onVote={null} onDelete={session.isLeader ? deletePoll : null} />)}
        </div>
      )}
    </div>
  )
}

function PollCard({ poll, myVote, onVote, onClose, onDelete }) {
  const votes = poll.poll_votes || []
  const totalVotes = votes.length
  const hasVoted = myVote !== undefined

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <div className="flex justify-between items-start mb-3">
        <p className="font-semibold text-ink text-sm flex-1 pr-2">{poll.question}</p>
        <div className="flex gap-1 shrink-0">
          {onClose && poll.active && <button onClick={() => onClose(poll.id)} className="text-xs text-ink/30 hover:text-ink/60">Close</button>}
          {onDelete && <button onClick={() => onDelete(poll.id)} className="text-ink/20 hover:text-clay text-lg px-1 leading-none">×</button>}
        </div>
      </div>
      <div className="space-y-2">
        {(poll.options || []).map((option, i) => {
          const count = votes.filter(v => v.option_index === i).length
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isMyVote = myVote === i
          const canVote = onVote && !hasVoted && poll.active
          return (
            <button
              key={i}
              onClick={() => canVote && onVote(poll.id, i)}
              disabled={!canVote}
              className={`w-full text-left rounded-xl overflow-hidden relative ${canVote ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`absolute inset-0 rounded-xl transition-all ${isMyVote ? 'bg-canopy/20' : 'bg-ink/5'}`}
                style={{ width: hasVoted || !poll.active ? `${pct}%` : '100%', transition: 'width 0.5s ease' }} />
              <div className="relative px-3 py-2.5 flex justify-between items-center">
                <span className={`text-sm font-medium ${isMyVote ? 'text-canopy' : 'text-ink'}`}>
                  {isMyVote && '✓ '}{option}
                </span>
                {(hasVoted || !poll.active) && (
                  <span className="text-xs text-ink/50 font-semibold">{pct}%</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-ink/30 text-xs mt-2 text-right">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} · anonymous</p>
    </div>
  )
}
