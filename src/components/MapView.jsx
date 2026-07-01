import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Numbered circle pin
const pinIcon = (num, color = '#C75B39') => new L.DivIcon({
  className: '',
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;font-family:sans-serif;">${num}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

const DAYS = [
  {
    id: 'aug23', label: 'Aug 23', date: '2026-08-23', city: 'Rio de Janeiro',
    locations: [
      { id: 1, title: 'GIG Airport — Arrive', time: '8:20 AM', lat: -22.8099, lng: -43.2506 },
      { id: 2, title: 'Windsor Leme Hotel', time: '9:30 AM', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 3, title: 'Selarón Steps', time: '11:00 AM', lat: -22.9146, lng: -43.1796 },
      { id: 4, title: 'Sugarloaf Mountain', time: '2:00 PM', lat: -22.9489, lng: -43.1576 },
      { id: 5, title: 'Classico Beach Club', time: '5:30 PM', lat: -22.9556, lng: -43.1642 },
    ],
  },
  {
    id: 'aug24', label: 'Aug 24', date: '2026-08-24', city: 'Rio de Janeiro',
    locations: [
      { id: 1, title: 'Windsor Leme Hotel', time: 'Base', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 2, title: 'Christ the Redeemer', time: '9:00 AM', lat: -22.9519, lng: -43.2105 },
      { id: 3, title: 'Estádio Nilton Santos', time: '7:00 PM', lat: -22.9094, lng: -43.2306 },
    ],
  },
  {
    id: 'aug25', label: 'Aug 25', date: '2026-08-25', city: 'Rio de Janeiro',
    locations: [
      { id: 1, title: 'Windsor Leme Hotel', time: 'Base', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 2, title: 'Copacabana Beach', time: '10:00 AM', lat: -22.9711, lng: -43.1828 },
      { id: 3, title: 'Território Aprazível', time: '7:00 PM', lat: -22.9167, lng: -43.1833 },
    ],
  },
  {
    id: 'aug26', label: 'Aug 26', date: '2026-08-26', city: 'Búzios',
    locations: [
      { id: 1, title: 'Rio Búzios Beach Hotel', time: '1:00 PM', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 2, title: 'Búzios Beach', time: '3:00 PM', lat: -22.7485, lng: -41.8806 },
    ],
  },
  {
    id: 'aug27', label: 'Aug 27', date: '2026-08-27', city: 'Búzios',
    locations: [
      { id: 1, title: 'Rio Búzios Beach Hotel', time: 'Base', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 2, title: 'Schooner Boat Tour', time: '9:00 AM', lat: -22.7450, lng: -41.8750 },
    ],
  },
  {
    id: 'aug28', label: 'Aug 28', date: '2026-08-28', city: 'Búzios → Rio',
    locations: [
      { id: 1, title: 'Rio Búzios Beach Hotel', time: 'Morning', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 2, title: 'Back to Windsor Leme', time: '7:00 PM', lat: -22.9711, lng: -43.1731, hotel: true },
    ],
  },
]

// Flies to a target when it changes
function PanController({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.8 })
  }, [target?.id])
  return null
}

// Fits all pins in view
function FitBounds({ locations }) {
  const map = useMap()
  useEffect(() => {
    if (!locations.length) return
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15)
    } else {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations.map(l => l.id).join(',')])
  return null
}

export default function MapView() {
  const today = new Date().toISOString().slice(0, 10)
  const todayDay = DAYS.find(d => d.date === today)
  const [activeDay, setActiveDay] = useState(todayDay?.id || 'aug23')
  const [panTarget, setPanTarget] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const markerRefs = useRef({})

  const currentDay = DAYS.find(d => d.id === activeDay)
  const locations = currentDay?.locations || []
  const center = locations.length ? [locations[0].lat, locations[0].lng] : [-22.9519, -43.1729]

  function handleLocationClick(loc) {
    setSelectedId(loc.id)
    setPanTarget({ ...loc, _ts: Date.now() }) // force effect even if same loc
    // Open the popup
    const marker = markerRefs.current[loc.id]
    if (marker) marker.openPopup()
  }

  function handleDayChange(id) {
    setActiveDay(id)
    setPanTarget(null)
    setSelectedId(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-1 px-1 shrink-0">
        {DAYS.map(d => {
          const isToday = d.date === today
          return (
            <button key={d.id} onClick={() => handleDayChange(d.id)}
              className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors relative ${activeDay === d.id ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
              {d.label}
              {isToday && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-sand" />}
            </button>
          )
        })}
      </div>

      {currentDay && (
        <p className="text-clay text-xs font-semibold tracking-widest uppercase mb-2 shrink-0">
          📍 {currentDay.city}
        </p>
      )}

      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden mb-3" style={{ minHeight: 0 }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} key={activeDay}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds locations={locations} />
          <PanController target={panTarget} />
          {locations.map((loc, idx) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={pinIcon(idx + 1, loc.hotel ? '#0E4D3C' : '#C75B39')}
              ref={ref => { if (ref) markerRefs.current[loc.id] = ref }}
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <p className="font-bold text-sm">{idx + 1}. {loc.title}</p>
                  {loc.time && <p className="text-xs text-gray-500 mt-0.5">{loc.time}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Clickable location list */}
      <div className="shrink-0 space-y-1.5 pb-2 max-h-40 overflow-y-auto">
        {locations.map((loc, idx) => (
          <button
            key={loc.id}
            onClick={() => handleLocationClick(loc)}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 shadow-sm transition-colors text-left ${selectedId === loc.id ? 'bg-dusk text-sand' : 'bg-white text-ink'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${loc.hotel ? 'bg-canopy' : 'bg-clay'}`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${selectedId === loc.id ? 'text-sand' : 'text-ink'}`}>{loc.title}</p>
            </div>
            {loc.time && <p className={`text-[10px] shrink-0 ${selectedId === loc.id ? 'text-sand/70' : 'text-ink/40'}`}>{loc.time}</p>}
          </button>
        ))}
      </div>
    </div>
  )
}

