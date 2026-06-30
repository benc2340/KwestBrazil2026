import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabaseClient'

const pinIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#C75B39;width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 16],
})

const PINNED_LOCATIONS = [
  { id: 1, title: 'Windsor Leme Hotel', lat: -22.9711, lng: -43.1731, day: 'aug23' },
  { id: 2, title: 'Selarón Steps', lat: -22.9146, lng: -43.1796, day: 'aug23' },
  { id: 3, title: 'Sugarloaf Mountain', lat: -22.9489, lng: -43.1576, day: 'aug23' },
  { id: 4, title: 'Christ the Redeemer', lat: -22.9519, lng: -43.2105, day: 'aug24' },
  { id: 5, title: 'Estádio Nilton Santos', lat: -22.9094, lng: -43.2306, day: 'aug24' },
  { id: 6, title: 'Território Aprazível', lat: -22.9167, lng: -43.1833, day: 'aug25' },
  { id: 7, title: 'Rio Búzios Beach Hotel', lat: -22.7469, lng: -41.8819, day: 'aug26' },
]

const DAYS = [
  { id: 'all', label: 'Whole Trip' },
  { id: 'aug23', label: 'Aug 23' },
  { id: 'aug24', label: 'Aug 24' },
  { id: 'aug25', label: 'Aug 25' },
  { id: 'aug26', label: 'Aug 26' },
  { id: 'aug27', label: 'Aug 27' },
]

export default function MapView() {
  const [activeDay, setActiveDay] = useState('all')

  const visible = activeDay === 'all' ? PINNED_LOCATIONS : PINNED_LOCATIONS.filter(i => i.day === activeDay)
  const center = visible.length ? [visible[0].lat, visible[0].lng] : [-22.9519, -43.1729]

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-1 px-1 shrink-0">
        {DAYS.map((d) => (
          <button key={d.id} onClick={() => setActiveDay(d.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${activeDay === d.id ? 'bg-dusk text-sand' : 'bg-white text-ink/60'}`}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex-1 rounded-2xl overflow-hidden mb-4">
        <MapContainer center={center} zoom={activeDay === 'all' ? 8 : 13} key={activeDay}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {visible.map((item) => (
            <Marker key={item.id} position={[item.lat, item.lng]} icon={pinIcon}>
              <Popup><p className="font-semibold">{item.title}</p></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
