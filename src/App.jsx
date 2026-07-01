import { useEffect, useState } from 'react'
import PasscodeGate from './components/PasscodeGate'
import Layout from './components/Layout'
import HomeView from './components/HomeView'
import PlanView from './components/PlanView'
import SocialView from './components/SocialView'
import CrewView from './components/CrewView'

import InfoView from './components/InfoView'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('home')

  useEffect(() => {
    const saved = localStorage.getItem('kwest_session')
    if (saved) {
      const s = JSON.parse(saved)
      // If passcode has changed since they last logged in, force re-login
      if (s.passcode !== import.meta.env.VITE_TRIP_PASSCODE) {
        localStorage.removeItem('kwest_session')
        return
      }
      setSession(s)
      registerMember(s)
    }
  }, [])

  async function registerMember(s) {
    await supabase.from('trip_members').upsert(
      { name: s.name, is_leader: s.isLeader },
      { onConflict: 'name', ignoreDuplicates: true }
    )
  }

  async function handleUnlock(s) {
    await registerMember(s)
    setSession(s)
  }

  if (!session) return <PasscodeGate onUnlock={handleUnlock} />

  return (
    <Layout tab={tab} setTab={setTab} session={session}>
      {tab === 'home'     && <HomeView session={session} onNavigate={setTab} />}
      {tab === 'plan'     && <PlanView session={session} />}
      {tab === 'chat'     && <SocialView session={session} />}
      {tab === 'crew'     && <CrewView session={session} />}
      {tab === 'info'     && <InfoView />}
    </Layout>
  )
}


