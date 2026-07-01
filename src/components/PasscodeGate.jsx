import { useState } from 'react'

const TRIP_CODE = import.meta.env.VITE_TRIP_PASSCODE
const LEADER_CODE = import.meta.env.VITE_LEADER_PASSCODE
const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSCODE

export default function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [showLeaderField, setShowLeaderField] = useState(false)
  const [leaderCode, setLeaderCode] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter your alliterative name first!')
      return
    }
    if (code.trim() !== TRIP_CODE) {
      setError("That code doesn't match. Double check and try again.")
      return
    }
    const isAdmin = showLeaderField && leaderCode.trim() === ADMIN_CODE && ADMIN_CODE
    const isLeader = isAdmin || (showLeaderField && leaderCode.trim() === LEADER_CODE && LEADER_CODE)
    const session = { name: name.trim(), isLeader: Boolean(isLeader), isAdmin: Boolean(isAdmin), passcode: code.trim() }
    localStorage.setItem('kwest_session', JSON.stringify(session))
    onUnlock(session)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Rio background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1400')`,
        }}
      />
      {/* Brazil-colored overlay: deep green → blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#002776]/80 via-[#009C3B]/60 to-[#002776]/80" />

      {/* Yellow diamond accent — nod to the Brazilian flag */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[140vw] h-[60vh] opacity-10"
          style={{
            background: '#FFDF00',
            clipPath: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
          }}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,223,0,0.25)' }}
      >
        {/* Brazil flag colors accent bar */}
        <div className="flex h-1 rounded-full overflow-hidden mb-6">
          <div className="flex-1 bg-[#009C3B]" />
          <div className="flex-1 bg-[#FFDF00]" />
          <div className="flex-1 bg-[#002776]" />
        </div>

        <p className="text-[#FFDF00] font-semibold tracking-widest text-xs uppercase mb-1">
          Kellogg School of Management
        </p>
        <h1 className="font-display text-3xl text-white font-semibold mb-1">
          Brazil KWEST 2026
        </h1>
        <p className="text-white/50 text-sm mb-7">Rio de Janeiro & Búzios · Aug 22–29</p>

        <label className="block text-sm font-medium text-white/80 mb-1">
          Alliterative Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bacardi Brian"
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFDF00]/60"
        />

        <label className="block text-sm font-medium text-white/80 mb-1">Trip Passcode</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter the code from your leader"
          className="w-full mb-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFDF00]/60 tracking-widest"
        />

        {!showLeaderField ? (
          <button
            type="button"
            onClick={() => setShowLeaderField(true)}
            className="text-xs text-white/40 underline mb-4 block"
          >
            Trip leader? Enter your leader code
          </button>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1">Leader Code</label>
            <input
              value={leaderCode}
              onChange={(e) => setLeaderCode(e.target.value)}
              placeholder="Leader-only code"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFDF00]/60 tracking-widest"
            />
          </div>
        )}

        {error && <p className="text-[#FFDF00] text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="w-full font-bold py-3.5 rounded-xl transition-all text-[#002776]"
          style={{ background: 'linear-gradient(135deg, #FFDF00, #FFB800)' }}
        >
          Bora! 🇧🇷
        </button>
      </form>
    </div>
  )
}
