import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const DEPARTURE = new Date('2026-08-22T16:10:00-05:00') // 4:10 PM CDT Chicago

export default function HomeView({ session, onNavigate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    supabase.from('trip_members').select('id', { count: 'exact', head: true })
      .then(({ count }) => setMemberCount(count || 0))
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(t)
  }, [])

  function getTimeLeft() {
    const now = new Date()
    const diff = DEPARTURE - now
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((diff % (1000 * 60)) / 1000)
    return { days, hours, mins, secs }
  }

  return (
    <div className="h-full overflow-y-auto -mx-4 px-0">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1400"
          alt="Rio de Janeiro"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dusk/90 via-dusk/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-bloom text-xs font-semibold tracking-widest uppercase mb-1">Kellogg KWEST</p>
          <h1 className="font-display text-3xl text-white font-semibold">Brazil 2026</h1>
          <p className="text-white/60 text-sm">Rio de Janeiro & Búzios · Aug 22–29</p>
        </div>
      </div>

      <div className="px-4">
        {/* Countdown */}
        <div className="bg-dusk rounded-2xl p-5 mt-4 mb-4">
          <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-3">
            {timeLeft ? 'Wheels up in' : '🛫 We\'re flying!'}
          </p>
          {timeLeft ? (
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: timeLeft.days, label: 'Days' },
                { val: timeLeft.hours, label: 'Hrs' },
                { val: timeLeft.mins, label: 'Min' },
                { val: timeLeft.secs, label: 'Sec' },
              ].map(({ val, label }) => (
                <div key={label} className="bg-white/10 rounded-xl py-3 text-center">
                  <p className="font-display text-2xl font-semibold text-white">{String(val).padStart(2, '0')}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white font-display text-xl">Bora Brasil! 🇧🇷</p>
          )}
          <p className="text-white/30 text-xs mt-3 text-center">AA2323 departs O'Hare · Aug 22, 4:10 PM</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-display text-2xl font-semibold text-dusk">{memberCount}</p>
            <p className="text-ink/40 text-xs mt-0.5">KWESTees joined</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-display text-2xl font-semibold text-dusk">7</p>
            <p className="text-ink/40 text-xs mt-0.5">Days in Brazil</p>
          </div>
        </div>

        {/* Quick links */}
        <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-2">Quick Links</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: '📅', label: 'Itinerary', tab: 'plan' },
            { icon: '💬', label: 'Group Chat', tab: 'chat' },
            { icon: '👥', label: 'The Crew', tab: 'crew' },
            { icon: 'ℹ️', label: 'Resources', tab: 'info' },
          ].map(({ icon, label, tab }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left"
            >
              <span className="text-2xl">{icon}</span>
              <span className="font-medium text-ink text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
