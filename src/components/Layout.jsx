export default function Layout({ tab, setTab, session, children }) {
  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: ItineraryIcon },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'chat', label: 'Chat', icon: ChatIcon },
  ]

  return (
    <div className="h-screen w-screen flex flex-col bg-sand">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-bloom font-body font-semibold tracking-widest text-[10px] uppercase">Kellogg KWEST</p>
          <h1 className="font-display text-xl text-dusk font-semibold leading-tight">
            Brasil {session.isLeader && <span className="text-clay text-xs align-middle ml-1">· Leader</span>}
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-canopy text-sand flex items-center justify-center font-semibold text-sm">
          {session.name.slice(0, 1).toUpperCase()}
        </div>
      </header>
      <main className="flex-1 overflow-hidden px-4">{children}</main>
      <nav className="flex border-t border-ink/10 bg-sand">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${active ? 'text-clay' : 'text-ink/40'}`}>
              <Icon active={active} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function ItineraryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}
function MapIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}
function ChatIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9z" />
    </svg>
  )
}
