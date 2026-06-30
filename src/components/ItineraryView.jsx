import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// ─── Static trip data ────────────────────────────────────────────────────────


const DAYS = [
  {
    id: 'overview',
    label: 'Trip Overview',
    date: null,
    activities: [],
  },
  {
    id: 'aug22',
    label: 'Aug 22',
    sublabel: 'Day 1 · Departure',
    date: 'Saturday, August 22',
    city: '✈️ Chicago → Miami → Rio',
    activities: [
      { time: '4:10 PM', title: 'Depart Chicago O\'Hare', detail: 'Flight AA2323 to Miami', photo: null },
      { time: '8:30 PM', title: 'Arrive in Miami', detail: 'Short layover at MIA', photo: null },
      { time: '10:55 PM', title: 'Depart Miami', detail: 'Flight AA905 to Rio de Janeiro', photo: null },
    ],
  },
  {
    id: 'aug23',
    label: 'Aug 23',
    sublabel: 'Day 2 · Arrival',
    date: 'Sunday, August 23',
    city: '🌆 Rio de Janeiro',
    activities: [
      { time: '8:20 AM', title: 'Arrive in Rio de Janeiro', detail: 'GIG — Galeão International Airport', photo: null },
      { time: '9:30 AM', title: 'Commute & Check-in', detail: 'Windsor Leme Hotel, Copacabana', photo: null },
      { time: '11:00 AM', title: 'Lunch & Selarón Steps', detail: 'Colorful mosaic staircase in the Lapa neighborhood — a Rio icon', photo: 'https://images.pexels.com/photos/18006362/pexels-photo-18006362.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '2:00 PM', title: 'Sugarloaf Mountain Tour', detail: 'Cable car ride to the summit with panoramic views of Rio', photo: 'https://images.pexels.com/photos/8530451/pexels-photo-8530451.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '5:30 PM', title: 'Dinner at Classico Beach Club', detail: 'Waterfront dinner to start the trip right', photo: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '8:30 PM', title: 'Explore Rio Bars', detail: 'Night out with your new KWESTee besties!', photo: null },
    ],
  },
  {
    id: 'aug24',
    label: 'Aug 24',
    sublabel: 'Day 3 · Cristo & Futebol',
    date: 'Monday, August 24',
    city: '⚽ Rio de Janeiro',
    activities: [
      { time: '8:00–9:00 AM', title: 'Breakfast at Hotel', detail: null, photo: null },
      { time: '9:00 AM–1:00 PM', title: 'Christ the Redeemer Tour', detail: 'One of the Seven Wonders of the World — the iconic statue atop Corcovado Mountain', photo: 'https://images.pexels.com/photos/3607628/pexels-photo-3607628.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '1:00 PM', title: 'Small Group Lunches (SGDs)', detail: 'Lunch with your small group', photo: null },
      { time: '3:00–5:00 PM', title: 'Free Time', detail: null, photo: null },
      { time: '5:00–6:00 PM', title: 'Quick Dinner', detail: null, photo: null },
      { time: '6:00 PM', title: 'Board Bus for Soccer Game', detail: 'Heading to Estádio Nilton Santos', photo: null },
      { time: '7:00 PM', title: 'Botafogo vs. Atlético', detail: 'Estádio Nilton Santos, Rio de Janeiro — Brazilian football at its finest!', photo: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '10:00 PM', title: 'Night Out on the Town', detail: 'Keep the energy going in Rio!', photo: null },
    ],
  },
  {
    id: 'aug25',
    label: 'Aug 25',
    sublabel: 'Day 4 · Beach & Big Reveal',
    date: 'Tuesday, August 25',
    city: '🏖️ Rio de Janeiro',
    activities: [
      { time: '8:00–10:00 AM', title: 'Breakfast at Hotel', detail: null, photo: null },
      { time: '10:00 AM–12:00 PM', title: 'Beach Time', detail: 'Sun, sand, and the iconic shores of Copacabana', photo: 'https://images.pexels.com/photos/19110695/pexels-photo-19110695.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '12:00–2:00 PM', title: 'Small Group Lunches (SGDs)', detail: null, photo: null },
      { time: '2:00–5:00 PM', title: 'Beach Time', detail: 'More time in the sun', photo: null },
      { time: '6:30 PM', title: 'Pick-up for Big Reveal', detail: 'Get ready for something special', photo: null },
      { time: '7:00 PM', title: '🎉 Big Reveal', detail: 'Território Aprazível, Rio de Janeiro — surprise awaits!', photo: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '10:30 PM', title: 'Keep the Party Going', detail: 'Local bars and clubs', photo: null },
    ],
  },
  {
    id: 'aug26',
    label: 'Aug 26',
    sublabel: 'Day 5 · Búzios',
    date: 'Wednesday, August 26',
    city: '🌴 Búzios',
    activities: [
      { time: '8:00–9:30 AM', title: 'Breakfast at Hotel', detail: null, photo: null },
      { time: '9:30 AM', title: 'Depart for Búzios', detail: 'Scenic bus ride — nap, hydrate, and take in the views', photo: null },
      { time: '1:00 PM', title: 'Arrive & Check-in', detail: 'Rio Búzios Beach Hotel', photo: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '1:00–3:00 PM', title: 'Free Time + Lunch Nearby', detail: null, photo: null },
      { time: '3:00–5:00 PM', title: 'Caipirinha Class on the Beach', detail: 'Learn to make Brazil\'s national cocktail with your feet in the sand', photo: 'https://images.pexels.com/photos/5947019/pexels-photo-5947019.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '5:00–10:00 PM', title: 'Dinner & Dance at Beach Club', detail: 'Sunset dinner followed by dancing', photo: null },
      { time: '10:00 PM', title: 'Samba the Night Away', detail: 'Búzios bars — bom noite!', photo: null },
    ],
  },
  {
    id: 'aug27',
    label: 'Aug 27',
    sublabel: 'Day 6 · Boat Day',
    date: 'Thursday, August 27',
    city: '⛵ Búzios',
    activities: [
      { time: '8:00–9:00 AM', title: 'Breakfast at Hotel', detail: null, photo: null },
      { time: '9:00 AM–3:00 PM', title: 'Schooner Boat Tour', detail: 'Beach-hopping along the stunning Búzios coastline', photo: 'https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop' },
      { time: '3:00–6:00 PM', title: 'Free Time at the Hotel', detail: null, photo: null },
      { time: '6:00–8:30 PM', title: 'Farewell Dinner', detail: 'Our last night in Búzios — make it count', photo: null },
      { time: '9:00 PM', title: 'Last Night Out in Brazil!', detail: 'Go out with a bang', photo: null },
    ],
  },
  {
    id: 'aug28',
    label: 'Aug 28',
    sublabel: 'Day 7 · Return to Rio',
    date: 'Friday, August 28',
    city: '🚌 Búzios → Rio',
    activities: [
      { time: '9:00–10:00 AM', title: 'Breakfast at Hotel', detail: null, photo: null },
      { time: '10:00 AM–3:00 PM', title: 'Free Time in Búzios', detail: 'Last chance to soak it all in', photo: null },
      { time: '3:00–7:00 PM', title: 'Travel Back to Rio', detail: null, photo: null },
      { time: '11:00 PM', title: 'Depart Rio', detail: 'Flight AA904 — sleep well, you\'ve earned it', photo: null },
    ],
  },
  {
    id: 'aug29',
    label: 'Aug 29',
    sublabel: 'Day 8 · Home',
    date: 'Saturday, August 29',
    city: '✈️ Rio → Miami → Chicago',
    activities: [
      { time: '6:35 AM', title: 'Arrive in Miami', detail: null, photo: null },
      { time: '9:09 AM', title: 'Depart Miami', detail: 'Flight AA1431 to Chicago', photo: null },
      { time: '11:36 AM', title: 'Arrive at O\'Hare', detail: 'Welcome home — with lifelong friends and memories!', photo: null },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function ItineraryView({ session }) {
  const [activeDay, setActiveDay] = useState('overview')
  const [notes, setNotes] = useState({})
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightboxActivity, setLightboxActivity] = useState(null)

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    const { data } = await supabase.from('itinerary_notes').select('*')
    if (data) {
      const map = {}
      data.forEach(n => { map[n.activity_key] = n.note })
      setNotes(map)
    }
  }

  async function saveNote(key) {
    setSaving(true)
    const existing = await supabase.from('itinerary_notes').select('id').eq('activity_key', key).single()
    if (existing.data) {
      await supabase.from('itinerary_notes').update({ note: noteText }).eq('activity_key', key)
    } else {
      await supabase.from('itinerary_notes').insert({ activity_key: key, note: noteText })
    }
    setNotes(prev => ({ ...prev, [key]: noteText }))
    setEditingNote(null)
    setSaving(false)
  }

  async function deleteNote(key) {
    await supabase.from('itinerary_notes').delete().eq('activity_key', key)
    setNotes(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const currentDay = DAYS.find(d => d.id === activeDay)

  return (
    <div className="h-full flex flex-col">
      {/* Lightbox */}
      {lightboxActivity && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 flex flex-col items-center justify-center"
          onClick={() => setLightboxActivity(null)}
        >
          <button className="absolute top-5 right-5 text-sand text-3xl font-light">×</button>
          <p className="text-sand font-semibold mb-3 px-6 text-center">{lightboxActivity.title}</p>
          <img
            src={lightboxActivity.photo.replace('w=800&h=500', 'w=2400')}
            alt={lightboxActivity.title}
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-1 px-1 shrink-0">
        {DAYS.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDay(d.id)}
            className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors text-left ${
              activeDay === d.id ? 'bg-dusk text-sand' : 'bg-white text-ink/60'
            }`}
          >
            {d.label}
            {d.sublabel && activeDay === d.id && (
              <span className="block text-[10px] opacity-70">{d.sublabel}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {activeDay === 'overview' ? (
          <OverviewTab />
        ) : (
          <DayTab
            day={currentDay}
            notes={notes}
            session={session}
            editingNote={editingNote}
            noteText={noteText}
            saving={saving}
            onStartEdit={(key, existing) => { setEditingNote(key); setNoteText(existing || '') }}
            onSaveNote={saveNote}
            onDeleteNote={deleteNote}
            onChangeNote={setNoteText}
            onCancelNote={() => setEditingNote(null)}
            onOpenPhoto={setLightboxActivity}
          />
        )}
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="pb-4">
      <img
        src="/trip-overview.jpg"
        alt="KWEST Brazil Trip Overview"
        className="w-full rounded-2xl shadow-sm"
      />
    </div>
  )
}

// ─── Day Tab ──────────────────────────────────────────────────────────────────

function DayTab({ day, notes, session, editingNote, noteText, saving, onStartEdit, onSaveNote, onDeleteNote, onChangeNote, onCancelNote, onOpenPhoto }) {
  if (!day) return null
  return (
    <div>
      <div className="mb-4">
        <p className="text-clay text-xs font-semibold tracking-widest uppercase">{day.city}</p>
        <h2 className="font-display text-xl font-semibold text-dusk">{day.date}</h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[52px] top-0 bottom-0 w-px bg-ink/10" />

        <div className="space-y-4">
          {day.activities.map((activity, idx) => {
            const key = `${day.id}-${idx}`
            const note = notes[key]
            const isEditing = editingNote === key
            return (
              <div key={key} className="flex gap-3">
                {/* Time */}
                <div className="w-[52px] shrink-0 pt-3 text-right pr-3">
                  <span className="text-[10px] font-semibold text-clay leading-tight">{activity.time}</span>
                </div>

                {/* Dot */}
                <div className="shrink-0 mt-3.5 z-10">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 ${activity.photo ? 'bg-clay border-clay' : 'bg-white border-ink/30'}`} />
                </div>

                {/* Card */}
                <div className="flex-1 pb-1">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3 flex gap-3 items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-ink text-sm">{activity.title}</p>
                        {activity.detail && <p className="text-ink/50 text-xs mt-0.5">{activity.detail}</p>}
                      </div>
                      {activity.photo && (
                        <button
                          onClick={() => onOpenPhoto(activity)}
                          className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-ink/10 relative"
                        >
                          <img
                            src={activity.photo.replace('w=800&h=500', 'w=200&h=200')}
                            alt={activity.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.parentElement.style.display = 'none' }}
                          />
                          <div className="absolute inset-0 bg-ink/10 flex items-center justify-center">
                            <span className="text-white text-lg">🔍</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {(note || session.isLeader) && (
                      <div className="px-3 pb-3">
                        {/* Leader note */}
                        {note && !isEditing && (
                          <div className="bg-bloom/15 rounded-xl px-3 py-2 flex justify-between items-start gap-2">
                            <p className="text-xs text-ink/70 flex-1">📌 {note}</p>
                            {session.isLeader && (
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => onStartEdit(key, note)} className="text-[10px] text-dusk/60">Edit</button>
                                <button onClick={() => onDeleteNote(key)} className="text-[10px] text-clay/70">Remove</button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Leader edit */}
                        {session.isLeader && isEditing && (
                          <div>
                            <textarea
                              value={noteText}
                              onChange={e => onChangeNote(e.target.value)}
                              placeholder="Add a leader note for this activity…"
                              className="w-full text-xs border border-ink/15 rounded-xl px-3 py-2 resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2 mt-1">
                              <button onClick={onCancelNote} className="text-xs text-ink/50">Cancel</button>
                              <button onClick={() => onSaveNote(key)} disabled={saving} className="text-xs text-clay font-medium">
                                {saving ? 'Saving…' : 'Save note'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Add note button */}
                        {session.isLeader && !note && !isEditing && (
                          <button onClick={() => onStartEdit(key, '')} className="text-[10px] text-dusk/40 font-medium">
                            + Add leader note
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

