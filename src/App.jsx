import { useEffect, useState } from 'react'
import PasscodeGate from './components/PasscodeGate'
import Layout from './components/Layout'
import ItineraryView from './components/ItineraryView'
import MapView from './components/MapView'
import ChatView from './components/ChatView'

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('itinerary')

  useEffect(() => {
    const saved = localStorage.getItem('kwest_session')
    if (saved) setSession(JSON.parse(saved))
  }, [])

  if (!session) return <PasscodeGate onUnlock={setSession} />

  return (
    <Layout tab={tab} setTab={setTab} session={session}>
      {tab === 'itinerary' && <ItineraryView session={session} />}
      {tab === 'map' && <MapView session={session} />}
      {tab === 'chat' && <ChatView session={session} />}
    </Layout>
  )
}
