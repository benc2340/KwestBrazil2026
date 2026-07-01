import { useState } from 'react'
import ItineraryView from './ItineraryView'
import MapView from './MapView'

export default function PlanView({ session }) {
  const [subTab, setSubTab] = useState('schedule')

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        <button onClick={() => setSubTab('schedule')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'schedule' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          📅 Schedule
        </button>
        <button onClick={() => setSubTab('map')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'map' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          🗺️ Map
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {subTab === 'schedule' ? <ItineraryView session={session} /> : <MapView />}
      </div>
    </div>
  )
}
