import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TrailPreviewSheet from '../components/TrailPreviewSheet'
import { useTrails } from '../hooks/useTrails'

// Fix Leaflet default icon path broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const trailIcon = L.divIcon({
  className: 'mission-marker-icon',
  html: `<div style="
    width:44px; height:44px;
    background: #8B6914;
    border: 3px solid #F5E6C8;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
  "><span style="transform:rotate(45deg); font-size:20px; line-height:1;">🏔️</span></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
})

function UserLocationMarker() {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true })
    map.on('locationfound', e => {
      setPosition(e.latlng)
    })
    return () => map.stopLocate()
  }, [map])

  if (!position) return null

  const userIcon = L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:20px; height:20px;
      background: #3B82F6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  return <Marker position={position} icon={userIcon} />
}

export default function ExploreScreen({ onViewTrail }) {
  const [selected, setSelected] = useState(null)
  const { sentiers } = useTrails()

  return (
    <div className="relative w-full h-full">
      {/* Header banner */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3"
           style={{ background: 'linear-gradient(180deg, rgba(59,37,16,0.85) 0%, transparent 100%)' }}>
        <span className="font-adventure text-parchment-200 text-2xl tracking-wide drop-shadow">
          🧭 Terra Azur Explorer
        </span>
      </div>

      {/* Map */}
      <MapContainer
        center={[43.5167, 6.8833]}
        zoom={13}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <UserLocationMarker />

        {sentiers.map(sentier => (
          <Marker
            key={sentier.id}
            position={[sentier.lat_depart, sentier.lng_depart]}
            icon={trailIcon}
            eventHandlers={{ click: () => setSelected(sentier) }}
          />
        ))}
      </MapContainer>

      {/* Trail preview sheet */}
      {selected && (
        <TrailPreviewSheet
          sentier={selected}
          onClose={() => setSelected(null)}
          onView={trail => {
            setSelected(null)
            onViewTrail(trail)
          }}
        />
      )}
    </div>
  )
}
