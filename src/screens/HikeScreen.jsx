import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { distanceMetres } from '../lib/geo'

const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

// Marqueur mission (point d'interrogation si non fait, check si fait)
function missionIcon(done) {
  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:38px; height:38px;
      background: ${done ? '#3A5A2A' : '#8B6914'};
      border: 3px solid white;
      border-radius: 50%;
      display:flex; align-items:center; justify-content:center;
      font-size:18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">${done ? '✅' : '❓'}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

// Marqueur position utilisateur
const userIcon = L.divIcon({
  className: 'mission-marker-icon',
  html: `<div style="
    width:22px; height:22px;
    background: #3B82F6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 8px rgba(59,130,246,0.25);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

// Recentre la carte sur la position GPS
function RecenterMap({ position }) {
  const map = useMap()
  const hasCentered = useRef(false)
  useEffect(() => {
    if (position && !hasCentered.current) {
      map.setView(position, 15)
      hasCentered.current = true
    }
  }, [position, map])
  return null
}

export default function HikeScreen({ sentier, missions, collected, onBack, onUnlockMission }) {
  const [userPos, setUserPos] = useState(null)
  const [nearbyMission, setNearbyMission] = useState(null)
  const watchRef = useRef(null)

  const completedCount = missions.filter(m => collected.includes(m.id)).length

  // Surveille la position GPS
  useEffect(() => {
    if (!navigator.geolocation) return

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserPos([lat, lng])

        // Vérifie si on est proche d'une mission non complétée
        const found = missions.find(m => {
          if (collected.includes(m.id)) return false
          const dist = distanceMetres(lat, lng, m.lat, m.lng)
          return dist <= (m.rayon_metres || 50)
        })
        setNearbyMission(found || null)
      },
      err => console.warn('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [missions, collected])

  // Position de démo si pas de GPS (pour tester en dev)
  const mapCenter = userPos || [sentier.lat_depart, sentier.lng_depart]

  return (
    <div className="relative w-full h-full">

      {/* Barre du haut */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-3 py-2"
           style={{ background: 'linear-gradient(180deg, rgba(59,37,16,0.92) 0%, transparent 100%)' }}>
        <button
          onClick={onBack}
          className="bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg backdrop-blur-sm flex-shrink-0"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-adventure text-parchment-200 text-base leading-tight truncate">
            {sentier.nom}
          </p>
          <p className="text-parchment-300 text-xs font-body">
            🎯 {completedCount} / {missions.length} missions
          </p>
        </div>
        {/* Barre de progression compacte */}
        <div className="w-20 bg-white/20 rounded-full h-2 flex-shrink-0">
          <div
            className="bg-adventure-gold h-2 rounded-full transition-all"
            style={{ width: `${missions.length > 0 ? (completedCount / missions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Carte */}
      <MapContainer
        center={mapCenter}
        zoom={15}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={userPos} />

        {/* Position utilisateur */}
        {userPos && (
          <>
            <Marker position={userPos} icon={userIcon} />
            <Circle
              center={userPos}
              radius={50}
              pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.08, weight: 1 }}
            />
          </>
        )}

        {/* Marqueurs de mission */}
        {missions.map(mission => (
          <Marker
            key={mission.id}
            position={[mission.lat, mission.lng]}
            icon={missionIcon(collected.includes(mission.id))}
          />
        ))}
      </MapContainer>

      {/* Pastille GPS non dispo */}
      {!userPos && (
        <div className="absolute top-20 left-4 right-4 z-30 bg-black/60 text-white text-xs text-center py-2 px-3 rounded-xl backdrop-blur-sm font-body">
          📍 En attente du signal GPS… (accepte la localisation si demandé)
        </div>
      )}


      {/* Notification mission à proximité */}
      {nearbyMission && (
        <div className="absolute bottom-6 left-4 right-4 z-30 nearby-pulse">
          <div className="bg-adventure-brown rounded-2xl p-4 shadow-2xl border-4 border-adventure-gold font-body">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">
                {CATEGORY_EMOJI[nearbyMission.categorie] || '🎯'}
              </span>
              <div>
                <p className="text-parchment-200 font-bold text-sm">Mission à proximité !</p>
                <p className="text-parchment-300 text-xs">{nearbyMission.categorie}</p>
              </div>
            </div>
            <button
              onClick={() => onUnlockMission(nearbyMission)}
              className="w-full bg-adventure-gold text-white font-adventure text-lg py-3 rounded-xl active:scale-95 transition-transform"
            >
              🔓 Débloquer la mission !
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
