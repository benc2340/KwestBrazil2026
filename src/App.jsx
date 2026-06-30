import { useEffect, useState } from 'react'
import PasscodeGate from './components/PasscodeGate'
import Layout from './components/Layout'
import ItineraryView from './components/ItineraryView'
import MapView from './components/MapView'
import ChatView from './components/ChatView'
import DirectoryView from './components/DirectoryView'
import CheckinView from './components/CheckinView'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('itinerary')

  useEffect(() => {
    const saved = localStorage.getItem('kwest_session')
    if (saved) {
      const s = JSON.parse(saved)
      setSession(s)
      registerMember(s)
    }
  }, [])

  async function registerMember(s) {
    // Upsert member into directory — name is unique key
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
      {tab === 'itinerary' && <ItineraryView session={session} />}
      {tab === 'map' && <MapView session={session} />}
      {tab === 'directory' && <DirectoryView session={session} />}
      {tab === 'checkin' && <CheckinView session={session} />}
      {tab === 'chat' && <ChatView session={session} />}
    </Layout>
  )
}
