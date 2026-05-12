import React from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Côte d'Azur center / zoom — covers Marseille → Mercantour
const COTE_AZUR_CENTER = [43.63, 7.01]
const COTE_AZUR_ZOOM = 9

const COLORS = {
  done:    { bg: '#4a6b3a', label: 'Terminé' },
  active:  { bg: '#b8862e', label: 'En cours' },
  available: { bg: '#8a7e6c', label: 'Disponible' },
}

function makeIcon(state) {
  const c = COLORS[state] || COLORS.available
  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:26px; height:26px;
      background: ${c.bg};
      border: 2px solid #f4ecd8;
      border-radius: 50%;
      box-shadow: 0 0 0 1.5px #2b2620, 0 2px 6px rgba(43,38,32,0.4);
      display:flex; align-items:center; justify-content:center;
      color: #f4ecd8;
      font-family: 'Caveat', cursive;
      font-weight: 700;
      font-size: 14px;
    ">${state === 'done' ? '✓' : state === 'active' ? '●' : ''}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

export default function MiniMap({ sentiers, trailStates, onPickTrail, height = 200 }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        height,
        border: '1.5px solid #2b2620',
        boxShadow: '2px 2px 0 #2b2620',
      }}
    >
      <MapContainer
        center={COTE_AZUR_CENTER}
        zoom={COTE_AZUR_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: '#cde9e6' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sentiers.map(s => (
          <Marker
            key={s.id}
            position={[s.lat_depart, s.lng_depart]}
            icon={makeIcon(trailStates[s.id] || 'available')}
            eventHandlers={{ click: () => onPickTrail(s) }}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        className="absolute left-2 bottom-2 z-[400] flex items-center gap-2 px-2 py-1 rounded-md backdrop-blur-sm"
        style={{
          background: 'rgba(244,236,216,0.92)',
          border: '1px solid #2b2620',
        }}
      >
        {Object.entries(COLORS).map(([state, c]) => (
          <span
            key={state}
            className="inline-flex items-center gap-1 font-mono uppercase"
            style={{ fontSize: 8, letterSpacing: 1, color: '#2b2620' }}
          >
            <span
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: c.bg,
                border: '1px solid #2b2620',
                display: 'inline-block',
              }}
            />
            {c.label}
          </span>
        ))}
      </div>

      {/* Top-right label */}
      <div
        className="absolute right-2 top-2 z-[400] px-2 py-1 rounded-md backdrop-blur-sm font-mono uppercase"
        style={{
          background: 'rgba(244,236,216,0.92)',
          border: '1px solid #2b2620',
          fontSize: 9,
          letterSpacing: 1.5,
          color: '#2b2620',
        }}
      >
        CÔTE D'AZUR
      </div>
    </div>
  )
}
