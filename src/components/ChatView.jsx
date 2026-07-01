import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😮']

export default function ChatView({ session }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState({})
  const [reactions, setReactions] = useState({}) // messageId -> [{emoji, author_name}]
  const [broadcast, setBroadcast] = useState(null)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [showReactionPicker, setShowReactionPicker] = useState(null) // message id
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [showBroadcastInput, setShowBroadcastInput] = useState(false)
  const [broadcastText, setBroadcastText] = useState('')
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadAll()
    const channel = supabase.channel('chat_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (p) => setMessages(prev => [...prev, p.new]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (p) => setMessages(prev => prev.map(m => m.id === p.new.id ? p.new : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (p) => setMessages(prev => prev.filter(m => m.id !== p.old.id)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => loadReactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => loadBroadcast())
      .subscribe()
    const memberChannel = supabase.channel('member_avatars')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_members' }, () => loadMembers())
      .subscribe()
    return () => { supabase.removeChannel(channel); supabase.removeChannel(memberChannel) }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadAll() {
    await Promise.all([loadMembers(), loadMessages(), loadReactions(), loadBroadcast()])
  }

  async function loadMembers() {
    const { data } = await supabase.from('trip_members').select('name, avatar')
    if (data) {
      const map = {}
      data.forEach(m => { map[m.name] = m.avatar })
      setMembers(map)
    }
  }

  async function loadMessages() {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at').limit(300)
    setMessages(data || [])
  }

  async function loadReactions() {
    const { data } = await supabase.from('message_reactions').select('*')
    if (data) {
      const map = {}
      data.forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setReactions(map)
    }
  }

  async function loadBroadcast() {
    const { data } = await supabase.from('broadcasts').select('*').eq('active', true).single()
    setBroadcast(data || null)
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

  async function toggleReaction(messageId, emoji) {
    setShowReactionPicker(null)
    const existing = (reactions[messageId] || []).find(r => r.emoji === emoji && r.author_name === session.name)
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, author_name: session.name, emoji })
    }
  }

  async function saveBroadcast() {
    if (!broadcastText.trim()) return
    await supabase.from('broadcasts').update({ active: false }).eq('active', true)
    await supabase.from('broadcasts').insert({ content: broadcastText.trim(), created_by: session.name, active: true })
    setBroadcastText('')
    setShowBroadcastInput(false)
  }

  async function clearBroadcast() {
    await supabase.from('broadcasts').update({ active: false }).eq('active', true)
    setBroadcast(null)
  }

  const canManage = (m) => session.isLeader || m.author_name === session.name

  return (
    <div className="h-full flex flex-col">
      {/* Broadcast banner */}
      {broadcast && (
        <div className="bg-bloom/30 border border-bloom/50 rounded-2xl px-4 py-3 mb-2 shrink-0 flex items-start gap-2">
          <span className="text-lg shrink-0">📢</span>
          <p className="text-ink text-sm font-medium flex-1">{broadcast.content}</p>
          {session.isLeader && (
            <button onClick={clearBroadcast} className="text-ink/30 hover:text-clay text-lg leading-none shrink-0">×</button>
          )}
        </div>
      )}

      {/* Leader broadcast input */}
      {session.isLeader && showBroadcastInput && (
        <div className="bg-white rounded-2xl p-3 mb-2 shrink-0 shadow-sm">
          <input value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
            placeholder="Announcement to pin at top of chat…"
            className="w-full px-3 py-2 rounded-xl border border-ink/15 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-bloom" />
          <div className="flex gap-2">
            <button onClick={() => setShowBroadcastInput(false)} className="text-xs text-ink/40 px-3 py-1.5">Cancel</button>
            <button onClick={saveBroadcast} className="text-xs bg-bloom/30 text-ink font-semibold px-3 py-1.5 rounded-lg">Post Announcement</button>
          </div>
        </div>
      )}

      {(activeMenu || showReactionPicker) && (
        <div className="fixed inset-0 z-20" onClick={() => { setActiveMenu(null); setShowReactionPicker(null) }} />
      )}

      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {messages.length === 0 && (
          <p className="text-ink/40 text-sm text-center py-6">No messages yet. Say olá! 👋</p>
        )}
        {messages.map(m => {
          const mine = m.author_name === session.name
          const avatar = members[m.author_name]
          const isPhotoAvatar = avatar?.startsWith('http')
          const isMenuOpen = activeMenu === m.id
          const isEditing = editingId === m.id
          const msgReactions = reactions[m.id] || []

          // Group reactions by emoji
          const reactionGroups = REACTION_EMOJIS.reduce((acc, emoji) => {
            const group = msgReactions.filter(r => r.emoji === emoji)
            if (group.length) acc.push({ emoji, count: group.length, mine: group.some(r => r.author_name === session.name) })
            return acc
          }, [])

          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="shrink-0 w-8 h-8 rounded-full bg-canopy/10 overflow-hidden flex items-center justify-center self-end">
                {isPhotoAvatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">{avatar || '😎'}</span>}
              </div>

              <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'} relative`}>
                {!mine && <p className="text-[11px] text-ink/40 mb-0.5 ml-1">{m.author_name}</p>}

                {isEditing ? (
                  <div className="w-full">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-clay text-sm resize-none focus:outline-none" rows={2} autoFocus />
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-xs text-ink/40">Cancel</button>
                      <button onClick={() => saveEdit(m.id)} className="text-xs text-clay font-semibold">Save</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => canManage(m) && setActiveMenu(isMenuOpen ? null : m.id)} className="text-left">
                    {m.image_url ? (
                      <button onClick={e => { e.stopPropagation(); setLightbox(m) }}>
                        <img src={m.image_url} alt="" className="rounded-2xl max-w-full max-h-52 object-cover" />
                      </button>
                    ) : (
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-canopy text-sand rounded-br-sm' : 'bg-white text-ink rounded-bl-sm'}`}>
                        {m.content}
                        {m.edited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                      </div>
                    )}
                  </button>
                )}

                {/* Reactions display */}
                {reactionGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reactionGroups.map(({ emoji, count, mine: iMine }) => (
                      <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${iMine ? 'bg-canopy/10 border-canopy/30 text-canopy' : 'bg-white border-ink/10 text-ink/60'}`}>
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-0.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <p className="text-[10px] text-ink/30 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {/* Add reaction button */}
                  <button onClick={() => setShowReactionPicker(showReactionPicker === m.id ? null : m.id)}
                    className="text-ink/25 hover:text-ink/50 text-sm">
                    😊
                  </button>
                </div>

                {/* Reaction picker */}
                {showReactionPicker === m.id && (
                  <div className={`absolute bottom-8 z-30 bg-white rounded-2xl shadow-xl border border-ink/10 px-2 py-1.5 flex gap-1 ${mine ? 'right-0' : 'left-0'}`}>
                    {REACTION_EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                        className="text-xl hover:scale-125 transition-transform p-1">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message action menu */}
                {isMenuOpen && canManage(m) && (
                  <div className={`absolute bottom-12 z-30 bg-white rounded-2xl shadow-xl border border-ink/10 overflow-hidden ${mine ? 'right-0' : 'left-0'}`}>
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

      <form onSubmit={sendMessage} className="flex items-center gap-2 py-3 shrink-0">
        {session.isLeader && (
          <button type="button" onClick={() => setShowBroadcastInput(!showBroadcastInput)}
            className="shrink-0 w-11 h-11 rounded-full bg-bloom/20 text-ink/50 flex items-center justify-center text-lg">
            📢
          </button>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="shrink-0 w-11 h-11 rounded-full bg-bloom/30 text-clay flex items-center justify-center">
          {uploading ? '…' : '📷'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Message the group…"
          className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clay" />
        <button type="submit" className="shrink-0 w-11 h-11 rounded-full bg-dusk text-sand flex items-center justify-center">➤</button>
      </form>

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
