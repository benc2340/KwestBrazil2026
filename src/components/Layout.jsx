export default function Layout({ tab, setTab, session, children }) {
  function signOut() {
    if (!confirm('Sign out?')) return
    localStorage.removeItem('kwest_session')
    window.location.reload()
  }

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'plan', label: 'Plan', icon: PlanIcon },
    { id: 'chat', label: 'Chat', icon: ChatIcon },
    { id: 'crew', label: 'Crew', icon: CrewIcon },
    { id: 'info', label: 'Info', icon: InfoIcon },
  ]

  return (
    <div className="h-screen w-screen flex flex-col bg-sand">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-bloom font-body font-semibold tracking-widest text-[10px] uppercase">Kellogg KWEST</p>
          <h1 className="font-display text-xl text-dusk font-semibold leading-tight">
            Brazil 2026{session.isLeader && <span className="text-clay text-xs align-middle ml-1">· Leader</span>}
          </h1>
        </div>
        <button onClick={signOut} title="Sign out"
          className="w-9 h-9 rounded-full bg-canopy text-sand flex items-center justify-center font-semibold text-sm">
          {session.name.slice(0, 1).toUpperCase()}
        </button>
      </header>

      <main className="flex-1 overflow-hidden px-4">{children}</main>

      <nav className="flex border-t border-ink/10 bg-sand shrink-0">
        {tabs.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${active ? 'text-clay' : 'text-ink/40'}`}>
              <Icon active={active} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function HomeIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
}
function PlanIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
}
function ChatIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9z"/></svg>
}
function CrewIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}><circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6"/><circle cx="17" cy="7" r="3"/><path d="M11 20c0-3.3 2.7-6 6-6"/></svg>
}
function InfoIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="8" strokeLinecap="round" strokeWidth="2.5"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
}
