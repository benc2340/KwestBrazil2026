import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function GalleryView({ session }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { photo, comments }
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const commentsBottomRef = useRef(null)

  useEffect(() => {
    load()
    const channel = supabase.channel('photos_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_comments' }, (payload) => {
        setLightbox(prev => {
          if (!prev || prev.photo.id !== payload.new.photo_id) return prev
          return { ...prev, comments: [...prev.comments, payload.new] }
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photo_comments' }, (payload) => {
        setLightbox(prev => {
          if (!prev) return prev
          return { ...prev, comments: prev.comments.filter(c => c.id !== payload.old.id) }
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    commentsBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lightbox?.comments])

  async function load() {
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const { error } = await supabase.storage.from('trip-photos').upload(path, file)
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('trip-photos').getPublicUrl(path)
    await supabase.from('photos').insert({ uploaded_by: session.name, image_url: urlData.publicUrl })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function openPhoto(photo) {
    const { data: comments } = await supabase.from('photo_comments').select('*').eq('photo_id', photo.id).order('created_at')
    setLightbox({ photo, comments: comments || [] })
    setComment('')
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!comment.trim() || !lightbox) return
    setSubmitting(true)
    await supabase.from('photo_comments').insert({ photo_id: lightbox.photo.id, author_name: session.name, content: comment.trim() })
    setComment('')
    setSubmitting(false)
  }

  async function deleteComment(id) {
    await supabase.from('photo_comments').delete().eq('id', id)
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('photos').delete().eq('id', photo.id)
    setLightbox(null)
  }

  if (loading) return <div className="h-full flex items-center justify-center text-ink/40">Loading photos…</div>

  const canDeletePhoto = (photo) => session.isLeader || photo.uploaded_by === session.name
  const canDeleteComment = (c) => session.isLeader || c.author_name === session.name

  return (
    <div className="h-full flex flex-col">
      {/* Upload button */}
      <div className="flex justify-between items-center pb-3 pt-1 shrink-0">
        <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-dusk text-sand px-4 py-2 rounded-full text-sm font-medium"
        >
          {uploading ? '⏳ Uploading…' : '📷 Upload Photo'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-4">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <p className="text-5xl mb-3">📸</p>
            <p className="font-semibold text-ink mb-1">No photos yet</p>
            <p className="text-ink/40 text-sm">Be the first to share a moment from the trip!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map(p => (
              <button key={p.id} onClick={() => openPhoto(p)} className="aspect-square overflow-hidden rounded-lg relative group">
                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox with comments */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setLightbox(null)}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-12 pb-3 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="text-white/60 text-sm">← Back</button>
            {canDeletePhoto(lightbox.photo) && (
              <button onClick={() => deletePhoto(lightbox.photo)} className="text-clay text-sm">Delete</button>
            )}
          </div>

          {/* Photo */}
          <div className="shrink-0 relative" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.photo.image_url}
              alt=""
              className="w-full max-h-64 object-contain"
            />
            {/* Uploader badge */}
            <div className="absolute bottom-2 right-3 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full">
              📷 {lightbox.photo.uploaded_by}
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto bg-sand rounded-t-3xl mt-3 px-4 pt-4 pb-2" onClick={e => e.stopPropagation()}>
            <p className="text-ink/40 text-xs font-semibold tracking-widest uppercase mb-3">
              {lightbox.comments.length} Comment{lightbox.comments.length !== 1 ? 's' : ''}
            </p>
            {lightbox.comments.length === 0 && (
              <p className="text-ink/30 text-sm text-center py-4">No comments yet — be the first!</p>
            )}
            <div className="space-y-3 mb-4">
              {lightbox.comments.map(c => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="flex-1 bg-white rounded-2xl px-3 py-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-clay text-xs font-semibold mb-0.5">{c.author_name}</p>
                      <p className="text-ink/30 text-[10px] shrink-0">{new Date(c.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-ink text-sm">{c.content}</p>
                  </div>
                  {canDeleteComment(c) && (
                    <button onClick={() => deleteComment(c.id)} className="text-ink/20 hover:text-clay text-lg leading-none mt-1 shrink-0">×</button>
                  )}
                </div>
              ))}
              <div ref={commentsBottomRef} />
            </div>

            {/* Comment input */}
            <form onSubmit={submitComment} className="flex gap-2 pb-safe">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clay"
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="shrink-0 w-11 h-11 rounded-full bg-dusk text-sand flex items-center justify-center disabled:opacity-40"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
