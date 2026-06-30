import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ChatView({ session }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState({}) // name -> avatar URL
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadMembers()
    load()
    const channel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    // Refresh member avatars if someone uploads a new photo while chat is open
    const memberChannel = supabase
      .channel('member_avatar_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_members' }, () => {
        loadMembers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(memberChannel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMembers() {
    const { data } = await supabase.from('trip_members').select('name, avatar')
    if (data) {
      const map = {}
      data.forEach(m => { map[m.name] = m.avatar })
      setMembers(map)
    }
  }

  async function load() {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at').limit(200)
    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    await supabase.from('chat_messages').insert({ author_name: session.name, content: text.trim() })
    setText('')
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file)
    if (uploadError) {
      alert('Photo upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('trip-photos').getPublicUrl(path)
    await supabase.from('chat_messages').insert({ author_name: session.name, content: '', image_url: urlData.publicUrl })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-ink/40 text-sm text-center py-6">No messages yet. Say olá! 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.author_name === session.name
          const avatar = members[m.author_name]
          const isPhoto = avatar?.startsWith('http')
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-canopy/10 overflow-hidden flex items-center justify-center self-end">
                {isPhoto
                  ? <img src={avatar} alt={m.author_name} className="w-full h-full object-cover" />
                  : <span className="text-sm">{avatar || '😎'}</span>
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                {!mine && (
                  <p className="text-[11px] text-ink/40 mb-0.5 ml-1">{m.author_name}</p>
                )}
                {m.image_url ? (
                  <img src={m.image_url} alt="" className="rounded-2xl max-w-full max-h-64 object-cover" />
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-canopy text-sand rounded-br-sm' : 'bg-white text-ink rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 w-11 h-11 rounded-full bg-bloom/30 text-clay flex items-center justify-center"
        >
          {uploading ? '…' : '📷'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the group…"
          className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clay"
        />
        <button type="submit" className="shrink-0 w-11 h-11 rounded-full bg-dusk text-sand flex items-center justify-center">➤</button>
      </form>
    </div>
  )
}
