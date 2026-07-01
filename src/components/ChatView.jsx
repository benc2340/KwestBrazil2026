import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ChatView({ session }) {
  const [view, setView] = useState('chat')
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState({})
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null) // message id with open menu
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadMembers()
    load()
    const channel = supabase.channel('chat_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()
    const memberChannel = supabase.channel('member_avatar_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_members' }, () => loadMembers())
      .subscribe()
    return () => { supabase.removeChannel(channel); supabase.removeChannel(memberChannel) }
  }, [])

  useEffect(() => {
    if (view === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, view])

  async function loadMembers() {
    const { data } = await supabase.from('trip_members').select('name, avatar')
    if (data) {
      const map = {}
      data.forEach(m => { map[m.name] = m.avatar })
      setMembers(map)
    }
  }

  async function load() {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at').limit(300)
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
    const { error } = await supabase.storage.from('trip-photos').upload(path, file)
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('trip-photos').getPublicUrl(path)
    await supabase.from('chat_messages').insert({ author_name: session.name, content: '', image_url: urlData.publicUrl })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteMessage(id) {
    setActiveMenu(null)
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  async function startEdit(message) {
    setActiveMenu(null)
    setEditingId(message.id)
    setEditText(message.content)
  }

  async function saveEdit(id) {
    if (!editText.trim()) return
    await supabase.from('chat_messages').update({ content: editText.trim(), edited: true }).eq('id', id)
    setEditingId(null)
    setEditText('')
  }

  const photos = messages.filter(m => m.image_url)
  const canManage = (m) => session.isLeader || m.author_name === session.name

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 pb-3 pt-1 shrink-0">
        <button onClick={() => setView('chat')} className={`px-4 py-2 rounded-full text-sm font-medium ${view === 'chat' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          💬 Chat
        </button>
        <button onClick={() => setView('gallery')} className={`px-4 py-2 rounded-full text-sm font-medium ${view === 'gallery' ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
          🖼️ Photos {photos.length > 0 && `(${photos.length})`}
        </button>
      </div>

      {view === 'gallery' ? (
        <div className="flex-1 overflow-y-auto pb-4">
          {photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <p className="text-4xl mb-2">📸</p>
              <p className="font-semibold text-ink mb-1">No photos yet</p>
              <p className="text-ink/40 text-sm">Photos shared in chat will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {photos.map(m => (
                <button key={m.id} onClick={() => setLightbox(m)} className="aspect-square overflow-hidden rounded-lg">
                  <img src={m.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Dismiss menu on background tap */}
          {activeMenu && (
            <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
          )}

          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            {messages.length === 0 && (
              <p className="text-ink/40 text-sm text-center py-6">No messages yet. Say olá! 👋</p>
            )}
            {messages.map(m => {
              const mine = m.author_name === session.name
              const avatar = members[m.author_name]
              const isPhotoAvatar = avatar?.startsWith('http')
              const isMenuOpen = activeMenu === m.id
              const isEditing = editingId === m.id

              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-canopy/10 overflow-hidden flex items-center justify-center self-end">
                    {isPhotoAvatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">{avatar || '😎'}</span>}
                  </div>

                  {/* Bubble + actions */}
                  <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'} relative`}>
                    {!mine && <p className="text-[11px] text-ink/40 mb-0.5 ml-1">{m.author_name}</p>}

                    {isEditing ? (
                      <div className="w-full">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-clay text-sm resize-none focus:outline-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1 justify-end">
                          <button onClick={() => setEditingId(null)} className="text-xs text-ink/40">Cancel</button>
                          <button onClick={() => saveEdit(m.id)} className="text-xs text-clay font-semibold">Save</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onLongPress={() => canManage(m) && setActiveMenu(m.id)}
                        onClick={() => {
                          if (m.image_url) { setLightbox(m); return }
                          if (canManage(m)) setActiveMenu(isMenuOpen ? null : m.id)
                        }}
                        className="text-left"
                      >
                        {m.image_url ? (
                          <img src={m.image_url} alt="" className="rounded-2xl max-w-full max-h-52 object-cover" />
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-canopy text-sand rounded-br-sm' : 'bg-white text-ink rounded-bl-sm'}`}>
                            {m.content}
                            {m.edited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                          </div>
                        )}
                      </button>
                    )}

                    <p className="text-[10px] text-ink/30 mt-0.5 px-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>

                    {/* Action menu */}
                    {isMenuOpen && canManage(m) && (
                      <div className={`absolute bottom-8 z-30 bg-white rounded-2xl shadow-xl border border-ink/10 overflow-hidden ${mine ? 'right-0' : 'left-0'}`}>
                        {!m.image_url && mine && (
                          <button onClick={() => startEdit(m)} className="flex items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-sand w-full text-left">
                            ✏️ Edit
                          </button>
                        )}
                        <button onClick={() => deleteMessage(m.id)} className="flex items-center gap-2 px-4 py-3 text-sm text-clay hover:bg-sand w-full text-left">
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 py-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="shrink-0 w-11 h-11 rounded-full bg-bloom/30 text-clay flex items-center justify-center">
              {uploading ? '…' : '📷'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Message the group…"
              className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clay" />
            <button type="submit" className="shrink-0 w-11 h-11 rounded-full bg-dusk text-sand flex items-center justify-center">➤</button>
          </form>
        </>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white text-4xl font-light">×</button>
          <p className="text-white/60 text-xs mb-3">{lightbox.author_name}</p>
          <img src={lightbox.image_url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

