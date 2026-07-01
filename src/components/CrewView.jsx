import { useState } from 'react'
import DirectoryView from './DirectoryView'
import CheckinView from './CheckinView'

export default function CrewView({ session }) {
  const [subTab, setSubTab] = useState('directory')

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        <button onClick={() => setSubTab('directory')} className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'directory' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          👥 Directory
        </button>
        <button onClick={() => setSubTab('checkin')} className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'checkin' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          ✓ Check-in & Polls
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {subTab === 'directory' ? <DirectoryView session={session} /> : <CheckinView session={session} />}
      </div>
    </div>
  )
}
