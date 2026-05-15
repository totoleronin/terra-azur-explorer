import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { distanceMetres } from '../lib/geo'

const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

function missionIcon(done, mission) {
  const emoji = done ? '✅' : (mission.icone || CATEGORY_EMOJI[mission.categorie] || '🎯')
  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:40px; height:40px;
      background: ${done ? '#4a6b3a' : '#a14a3c'};
      border: 2.5px solid #f4ecd8;
      box-shadow: 0 0 0 1.5px #2b2620, 0 4px 10px rgba(43,38,32,0.35);
      border-radius: 50%;
      display:flex; align-items:center; justify-content:center;
      font-size:20px;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

const userIcon = L.divIcon({
  className: 'mission-marker-icon',
  html: `<div style="
    width:22px; height:22px;
    background: #a14a3c;
    border: 3px solid #f4ecd8;
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px #2b2620, 0 0 0 10px rgba(161,74,60,0.22);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function arrowIcon(deg) {
  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:20px; height:20px;
      display:flex; align-items:center; justify-content:center;
      transform:rotate(${deg}deg);
      color:#a14a3c; font-size:14px;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
    ">▲</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function calcBearing(p1, p2) {
  const toRad = x => x * Math.PI / 180
  const dLng = toRad(p2[1] - p1[1])
  const lat1 = toRad(p1[0]), lat2 = toRad(p2[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

// Finds the index of the closest route coordinate to a given point
function closestRouteIdx(coords, lat, lng) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dlat = coords[i][0] - lat
    const dlng = coords[i][1] - lng
    const d = dlat * dlat + dlng * dlng
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

function RouteLayer({ coords, missions = [], collected = [], userPos = null }) {
  if (!coords || coords.length < 2) return null

  // Split index = furthest along the route between (a) all completed missions and (b) current user position
  let splitIdx = 0
  missions.forEach(m => {
    if (!collected.includes(m.id)) return
    const idx = closestRouteIdx(coords, m.lat, m.lng)
    if (idx > splitIdx) splitIdx = idx
  })
  if (userPos) {
    const idx = closestRouteIdx(coords, userPos[0], userPos[1])
    if (idx > splitIdx) splitIdx = idx
  }

  const doneCoords = splitIdx > 0 ? coords.slice(0, splitIdx + 1) : []
  const remainingCoords = coords.slice(splitIdx)

  // Arrows on the remaining (not-yet-walked) portion
  const arrows = remainingCoords.length >= 2
    ? [0.3, 0.7].map(frac => {
        const idx = Math.max(0, Math.floor(frac * (remainingCoords.length - 2)))
        return { pos: remainingCoords[idx], deg: calcBearing(remainingCoords[idx], remainingCoords[idx + 1]) }
      })
    : []

  return (
    <>
      {/* Remaining portion — terra red */}
      {remainingCoords.length >= 2 && (
        <Polyline
          positions={remainingCoords}
          pathOptions={{ color: '#a14a3c', weight: 4, opacity: 0.85 }}
        />
      )}
      {/* Consumed portion — green (drawn on top so the join looks clean) */}
      {doneCoords.length >= 2 && (
        <Polyline
          positions={doneCoords}
          pathOptions={{ color: '#4a6b3a', weight: 5, opacity: 0.95 }}
        />
      )}
      {arrows.map((a, i) => (
        <Marker key={i} position={a.pos} icon={arrowIcon(a.deg)} />
      ))}
    </>
  )
}

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

function HudChip({ icon, label, value, align = 'left' }) {
  return (
    <div
      className="rounded-xl px-2.5 py-1.5 backdrop-blur-sm"
      style={{
        background: 'rgba(244,236,216,0.92)',
        border: '1.5px solid #2b2620',
        boxShadow: '1.5px 1.5px 0 #2b2620',
        minWidth: 88,
        textAlign: align,
      }}
    >
      <div
        className="font-mono uppercase flex items-center gap-1"
        style={{
          fontSize: 8,
          letterSpacing: 1.5,
          color: '#8a7e6c',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <span style={{ color: '#a14a3c' }}>{icon}</span>
        {label}
      </div>
      <div className="font-title font-bold text-ink leading-none" style={{ fontSize: 18 }}>
        {value}
      </div>
    </div>
  )
}

export default function HikeScreen({ sentier, missions, collected, onBack, onUnlockMission }) {
  const [userPos, setUserPos] = useState(null)
  const [nearbyMission, setNearbyMission] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const watchRef = useRef(null)
  const startTime = useRef(Date.now())

  const completedCount = missions.filter(m => collected.includes(m.id)).length
  const pct = missions.length > 0 ? (completedCount / missions.length) * 100 : 0

  const routeCoords = sentier.route_coords ||
    missions.map(m => [m.lat, m.lng]).concat(
      missions.length ? [[missions[0].lat, missions[0].lng]] : []
    )

  // next mission = first one not yet collected
  const nextMission = missions.find(m => !collected.includes(m.id))

  useEffect(() => {
    if (!navigator.geolocation) return
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserPos([lat, lng])
        const found = missions.find(m => {
          if (collected.includes(m.id)) return false
          return distanceMetres(lat, lng, m.lat, m.lng) <= (m.rayon_metres || 50)
        })
        setNearbyMission(found || null)
      },
      err => console.warn('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
  }, [missions, collected])

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const elapsedLabel = `${Math.floor(elapsed / 3600)}h${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}`
  const mapCenter = userPos || [sentier.lat_depart, sentier.lng_depart]

  // Distance done estimate: number of done missions / total * trail length
  const distanceDone = (completedCount / Math.max(1, missions.length)) * (sentier.distance_km || 0)

  return (
    <div className="relative w-full h-full overflow-hidden font-body text-ink">

      {/* MAP — full bleed real Leaflet + OSM */}
      <div className="absolute inset-0">
        <MapContainer center={mapCenter} zoom={15} zoomControl={false} className="w-full h-full">
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap position={userPos} />
          <RouteLayer coords={routeCoords} missions={missions} collected={collected} userPos={userPos} />

          {userPos && (
            <>
              <Marker position={userPos} icon={userIcon} />
              <Circle
                center={userPos}
                radius={50}
                pathOptions={{ color: '#a14a3c', fillColor: '#a14a3c', fillOpacity: 0.08, weight: 1 }}
              />
            </>
          )}

          {missions.map(mission => (
            <Marker
              key={mission.id}
              position={[mission.lat, mission.lng]}
              icon={missionIcon(collected.includes(mission.id), mission)}
            />
          ))}
        </MapContainer>
      </div>

      {/* TOP BAR */}
      <div
        className="absolute top-0 left-0 right-0 z-[10] flex items-center justify-between px-4"
        style={{ height: 56 }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full grid place-items-center cursor-pointer backdrop-blur-sm"
          style={{
            background: 'rgba(244,236,216,0.92)',
            border: '1.5px solid #2b2620',
            boxShadow: '1.5px 1.5px 0 #2b2620',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2 L4 7 L9 12" stroke="#2b2620" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-sm"
          style={{
            background: 'rgba(244,236,216,0.92)',
            border: '1.5px solid #2b2620',
            boxShadow: '1.5px 1.5px 0 #2b2620',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: '#a14a3c',
              boxShadow: '0 0 0 3px rgba(161,74,60,0.25)',
              animation: 'fadeIn 1s infinite alternate',
            }}
          />
          <span
            className="font-mono uppercase text-ink"
            style={{ fontSize: 9, letterSpacing: 1.5 }}
          >
            En rando · {elapsedLabel}
          </span>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* HUD chips */}
      <div className="absolute top-[100px] left-4 z-[8] flex flex-col gap-2">
        <HudChip
          icon="✦"
          label="MISSIONS"
          value={`${completedCount}/${missions.length}`}
        />
      </div>
      <div className="absolute top-[100px] right-4 z-[8] flex flex-col gap-2">
        <HudChip
          icon="📏"
          label="DISTANCE"
          value={`${sentier.distance_km} km`}
          align="right"
        />
      </div>

      {!userPos && (
        <div
          className="absolute top-[170px] left-4 right-4 z-[9] text-center py-2 px-3 rounded-xl backdrop-blur-sm font-body"
          style={{
            background: 'rgba(43,38,32,0.85)',
            color: '#f4ecd8',
            fontSize: 12,
          }}
        >
          📍 En attente du signal GPS… (accepte la localisation si demandé)
        </div>
      )}

      {/* BOTTOM SHEET: progress + next mission / nearby mission */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[9] px-4 pt-3.5 pb-5"
        style={{ background: 'linear-gradient(to top, #ebe0c2 75%, rgba(235,224,194,0))' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="font-mono text-ink-soft" style={{ fontSize: 10, letterSpacing: 1.5 }}>
            {distanceDone.toFixed(1)} / {sentier.distance_km} km
          </span>
          <div
            className="flex-1 h-1.5 rounded-full relative overflow-hidden"
            style={{ background: '#d9c79a', border: '1px solid #c9b78a' }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(to right, #4a6b3a, #a14a3c)',
              }}
            />
          </div>
          <span className="font-title font-bold text-ink" style={{ fontSize: 16 }}>
            {pct.toFixed(0)}%
          </span>
        </div>

        {nearbyMission ? (
          <div
            className="rounded-2xl px-3.5 py-3 flex items-center gap-3 nearby-pulse"
            style={{
              background: '#fff8e6',
              border: '1.5px solid #2b2620',
              boxShadow: '2px 2px 0 #2b2620',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl grid place-items-center flex-none text-2xl"
              style={{
                background: '#a14a3c',
                color: '#f4ecd8',
                border: '1.5px solid #2b2620',
              }}
            >
              {nearbyMission.icone || CATEGORY_EMOJI[nearbyMission.categorie] || '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 8, letterSpacing: 1.5 }}>
                Mission à proximité
              </div>
              <div className="font-title font-bold text-ink leading-none mt-0.5" style={{ fontSize: 22 }}>
                {nearbyMission.titre}
              </div>
            </div>
            <button
              onClick={() => onUnlockMission(nearbyMission)}
              className="cursor-pointer rounded-full px-3.5 py-2 font-title font-bold"
              style={{
                background: '#2b2620',
                color: '#f4ecd8',
                fontSize: 16,
                border: 'none',
              }}
            >
              Ouvrir
            </button>
          </div>
        ) : nextMission ? (
          <div
            className="rounded-2xl px-3.5 py-3 flex items-center gap-3"
            style={{
              background: '#fff8e6',
              border: '1.5px solid #2b2620',
              boxShadow: '2px 2px 0 #2b2620',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl grid place-items-center flex-none text-2xl"
              style={{
                background: '#a14a3c',
                color: '#f4ecd8',
                border: '1.5px solid #2b2620',
              }}
            >
              {nextMission.icone || CATEGORY_EMOJI[nextMission.categorie] || '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 8, letterSpacing: 1.5 }}>
                Prochaine mission
              </div>
              <div className="font-title font-bold text-ink leading-none mt-0.5" style={{ fontSize: 22 }}>
                {nextMission.titre}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl px-3.5 py-3 text-center font-title text-ink"
            style={{
              background: '#fff8e6',
              border: '1.5px solid #4a6b3a',
              boxShadow: '2px 2px 0 #2b2620',
              fontSize: 20,
            }}
          >
            🏆 Bravo, sentier terminé !
          </div>
        )}
      </div>
    </div>
  )
}
