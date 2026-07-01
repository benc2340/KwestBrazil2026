import { useState } from 'react'
import ChatView from './ChatView'
import GalleryView from './GalleryView'

export default function SocialView({ session }) {
  const [subTab, setSubTab] = useState('chat')

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        <button
          onClick={() => setSubTab('chat')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'chat' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setSubTab('gallery')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${subTab === 'gallery' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}
        >
          📸 Photos
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {subTab === 'chat' ? <ChatView session={session} /> : <GalleryView session={session} />}
      </div>
    </div>
  )
}
