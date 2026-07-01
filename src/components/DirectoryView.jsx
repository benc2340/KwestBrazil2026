import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function DirectoryView({ session }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('trip_members').select('*').order('joined_at')
    setMembers(data || [])
    setLoading(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
    const { error } = await supabase.storage.from('member-photos').upload(path, file, { upsert: true })
    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(path)
    const photoUrl = urlData.publicUrl
    await supabase.from('trip_members').update({ avatar: photoUrl }).eq('name', session.name)
    const saved = JSON.parse(localStorage.getItem('kwest_session') || '{}')
    saved.avatar = photoUrl
    localStorage.setItem('kwest_session', JSON.stringify(saved))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    load()
  }

  async function toggleLeader(member) {
    const action = member.is_leader ? 'Remove leader status from' : 'Make'
    if (!confirm(`${action} "${member.name}" ${member.is_leader ? '' : 'a leader'}?`)) return
    await supabase.from('trip_members').update({ is_leader: !member.is_leader }).eq('name', member.name)
    load()
  }

  async function kickMember(name) {
    if (!confirm(`Remove "${name}" from the directory?`)) return
    await supabase.from('trip_members').delete().eq('name', name)
    load()
  }

  if (loading) return <div className="h-full flex items-center justify-center text-ink/40">Loading crew…</div>

  const me = members.find(m => m.name === session.name)
  const leaders = members.filter(m => m.is_leader)
  const kwestees = members.filter(m => !m.is_leader)

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* My card with photo upload */}
      <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative shrink-0"
          >
            <Avatar member={me} size="lg" />
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">{uploading ? '…' : '📷'}</span>
            </div>
          </button>
          <div>
            <p className="font-semibold text-ink text-sm">{session.name}</p>
            <p className="text-ink/40 text-xs">
              {uploading ? 'Uploading…' : 'Tap photo to update'}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-3">
        {members.length} on this trip
      </p>

      {leaders.length > 0 && (
        <div className="mb-4">
          <p className="text-clay text-xs font-semibold tracking-widest uppercase mb-2">
            Leaders ({leaders.length})
          </p>
          <div className="space-y-2">
            {leaders.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                isMe={m.name === session.name}
                canKick={session.isLeader && m.name !== session.name}
                onKick={kickMember}
                isAdmin={session.isAdmin}
                onToggleLeader={toggleLeader}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-dusk text-xs font-semibold tracking-widest uppercase mb-2">
          KWESTees ({kwestees.length})
        </p>
        <div className="space-y-2">
          {kwestees.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              isMe={m.name === session.name}
              canKick={session.isLeader}
              onKick={kickMember}
              isAdmin={session.isAdmin}
              onToggleLeader={toggleLeader}
            />
          ))}
          {kwestees.length === 0 && (
            <p className="text-ink/30 text-sm text-center py-4">No KWESTees have joined yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Avatar({ member, size = 'md' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'
  const isPhoto = member?.avatar?.startsWith('http')
  return (
    <div className={`${dim} rounded-full bg-canopy/10 flex items-center justify-center shrink-0 overflow-hidden`}>
      {isPhoto
        ? <img src={member.avatar} alt={member?.name} className="w-full h-full object-cover" />
        : <span>{member?.avatar || '😎'}</span>
      }
    </div>
  )
}

function MemberCard({ member, isMe, canKick, onKick, isAdmin, onToggleLeader }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
      <Avatar member={member} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">
          {member.name}
          {isMe && <span className="text-clay text-xs font-normal ml-1">(you)</span>}
        </p>
        {member.is_leader && <p className="text-clay text-[11px]">Leader</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isAdmin && !isMe && (
          <button
            onClick={() => onToggleLeader(member)}
            title={member.is_leader ? 'Remove leader' : 'Make leader'}
            className="text-base px-1 opacity-40 hover:opacity-100 transition-opacity"
          >
            {member.is_leader ? '👑' : '⭐'}
          </button>
        )}
        {canKick && (
          <button
            onClick={() => onKick(member.name)}
            className="text-ink/20 hover:text-clay text-xl leading-none px-1"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
