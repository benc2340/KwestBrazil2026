import { useState } from 'react'

const TRIP_CODE = import.meta.env.VITE_TRIP_PASSCODE
const LEADER_CODE = import.meta.env.VITE_LEADER_PASSCODE

export default function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [showLeaderField, setShowLeaderField] = useState(false)
  const [leaderCode, setLeaderCode] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Tell us your name first.')
      return
    }
    if (code.trim() !== TRIP_CODE) {
      setError("That code doesn't match. Double check and try again.")
      return
    }
    const isLeader = showLeaderField && leaderCode.trim() === LEADER_CODE && LEADER_CODE
    const session = { name: name.trim(), isLeader: Boolean(isLeader) }
    localStorage.setItem('kwest_session', JSON.stringify(session))
    onUnlock(session)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-dusk relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-bloom/30 rounded-organic blur-2xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-clay/30 rounded-organic blur-2xl" />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm bg-sand rounded-3xl p-8 shadow-2xl">
        <p className="text-bloom font-body font-semibold tracking-widest text-xs uppercase mb-1">Kellogg KWEST</p>
        <h1 className="font-display text-3xl text-dusk font-semibold mb-6">Brasil, here we come</h1>
        <label className="block text-sm font-medium text-ink mb-1">Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className="w-full mb-4 px-4 py-3 rounded-xl border border-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-clay" />
        <label className="block text-sm font-medium text-ink mb-1">Trip passcode</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter the code from your leader" className="w-full mb-2 px-4 py-3 rounded-xl border border-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-clay tracking-widest" />
        {!showLeaderField ? (
          <button type="button" onClick={() => setShowLeaderField(true)} className="text-xs text-dusk/60 underline mb-4">Trip leader? Enter your leader code</button>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-1">Leader code</label>
            <input value={leaderCode} onChange={(e) => setLeaderCode(e.target.value)} placeholder="Leader-only code" className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-clay tracking-widest" />
          </div>
        )}
        {error && <p className="text-clay text-sm mb-3">{error}</p>}
        <button type="submit" className="w-full bg-canopy text-sand font-semibold py-3 rounded-xl hover:bg-canopy/90 transition-colors">Enter the trip</button>
      </form>
    </div>
  )
}
