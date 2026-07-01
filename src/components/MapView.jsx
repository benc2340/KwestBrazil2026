import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const pinIcon = (color = '#C75B39') => new L.DivIcon({
  className: '',
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 14],
})

const DAYS = [
  {
    id: 'aug23', label: 'Aug 23', date: '2026-08-23',
    city: 'Rio de Janeiro',
    locations: [
      { id: 1, title: 'Arrive — GIG Airport', time: '8:20 AM', lat: -22.8099, lng: -43.2506 },
      { id: 2, title: 'Windsor Leme Hotel', time: '9:30 AM', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 3, title: 'Selarón Steps', time: '11:00 AM', lat: -22.9146, lng: -43.1796 },
      { id: 4, title: 'Sugarloaf Mountain', time: '2:00 PM', lat: -22.9489, lng: -43.1576 },
      { id: 5, title: 'Classico Beach Club', time: '5:30 PM', lat: -22.9556, lng: -43.1642 },
    ],
  },
  {
    id: 'aug24', label: 'Aug 24', date: '2026-08-24',
    city: 'Rio de Janeiro',
    locations: [
      { id: 6, title: 'Windsor Leme Hotel', time: 'Base', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 7, title: 'Christ the Redeemer', time: '9:00 AM', lat: -22.9519, lng: -43.2105 },
      { id: 8, title: 'Estádio Nilton Santos', time: '7:00 PM', lat: -22.9094, lng: -43.2306 },
    ],
  },
  {
    id: 'aug25', label: 'Aug 25', date: '2026-08-25',
    city: 'Rio de Janeiro',
    locations: [
      { id: 9, title: 'Windsor Leme Hotel', time: 'Base', lat: -22.9711, lng: -43.1731, hotel: true },
      { id: 10, title: 'Copacabana Beach', time: '10:00 AM', lat: -22.9711, lng: -43.1828 },
      { id: 11, title: 'Território Aprazível', time: '7:00 PM', lat: -22.9167, lng: -43.1833 },
    ],
  },
  {
    id: 'aug26', label: 'Aug 26', date: '2026-08-26',
    city: 'Búzios',
    locations: [
      { id: 12, title: 'Rio Búzios Beach Hotel', time: '1:00 PM', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 13, title: 'Búzios Beach', time: '3:00 PM', lat: -22.7485, lng: -41.8806 },
    ],
  },
  {
    id: 'aug27', label: 'Aug 27', date: '2026-08-27',
    city: 'Búzios',
    locations: [
      { id: 14, title: 'Rio Búzios Beach Hotel', time: 'Base', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 15, title: 'Schooner Boat Tour', time: '9:00 AM', lat: -22.7450, lng: -41.8750 },
    ],
  },
  {
    id: 'aug28', label: 'Aug 28', date: '2026-08-28',
    city: 'Búzios → Rio',
    locations: [
      { id: 16, title: 'Rio Búzios Beach Hotel', time: 'Morning', lat: -22.7469, lng: -41.8819, hotel: true },
      { id: 17, title: 'Back to Windsor Leme', time: '7:00 PM', lat: -22.9711, lng: -43.1731, hotel: true },
    ],
  },
]

function FitBounds({ locations }) {
  const map = useMap()
  useEffect(() => {
    if (!locations.length) return
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 14)
    } else {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [locations.map(l => l.id).join(',')])
  return null
}

export default function MapView() {
  const today = new Date().toISOString().slice(0, 10)
  const todayDay = DAYS.find(d => d.date === today)
  const [activeDay, setActiveDay] = useState(todayDay?.id || 'aug23')

  const currentDay = DAYS.find(d => d.id === activeDay)
  const locations = currentDay?.locations || []
  const center = locations.length ? [locations[0].lat, locations[0].lng] : [-22.9519, -43.1729]

  return (
    <div className="h-full flex flex-col">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-1 px-1 shrink-0">
        {DAYS.map(d => {
          const isToday = d.date === today
          return (
            <button
              key={d.id}
              onClick={() => setActiveDay(d.id)}
              className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors relative ${
                activeDay === d.id ? 'bg-dusk text-sand' : 'bg-white text-ink/60'
              }`}
            >
              {d.label}
              {isToday && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-sand" />}
            </button>
          )
        })}
      </div>

      {/* City label */}
      {currentDay && (
        <p className="text-clay text-xs font-semibold tracking-widest uppercase mb-2 shrink-0">
          📍 {currentDay.city}
        </p>
      )}

      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden mb-3">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} key={activeDay}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds locations={locations} />
          {locations.map((loc, idx) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={pinIcon(loc.hotel ? '#0E4D3C' : '#C75B39')}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-sm">{loc.title}</p>
                  {loc.time && <p className="text-xs text-gray-500">{loc.time}</p>}
                  <p className="text-xs font-bold mt-1 text-gray-400">Stop {idx + 1}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Location list */}
      <div className="shrink-0 space-y-1.5 pb-2 max-h-36 overflow-y-auto">
        {locations.map((loc, idx) => (
          <div key={loc.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${loc.hotel ? 'bg-canopy' : 'bg-clay'}`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ink text-xs font-semibold truncate">{loc.title}</p>
            </div>
            {loc.time && <p className="text-ink/40 text-[10px] shrink-0">{loc.time}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
