import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { distanceMetres } from '../lib/geo'
import { useMissionNarrative } from '../hooks/useNarrative'
import { useWeather } from '../hooks/useWeather'

const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

// ── Icônes Leaflet ────────────────────────────────────────────────────────────

function missionIcon(done, isNext, mission) {
  const emoji = done ? '✓' : (isNext ? (mission.icone || CATEGORY_EMOJI[mission.categorie] || '🎯') : '?')
  const bg    = done ? '#4a6b3a' : (isNext ? '#a14a3c' : '#2e2b26')
  const color = done ? '#f4ecd8' : (isNext ? '#f4ecd8' : '#7a6e62')
  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="
      width:40px; height:40px;
      background:${bg};
      border:2.5px solid ${done ? '#f4ecd8' : isNext ? '#f4ecd8' : '#4a4540'};
      box-shadow:0 0 0 1.5px ${done ? '#4a6b3a' : '#2b2620'},0 4px 10px rgba(0,0,0,.4);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${done ? '14px' : '18px'};
      font-weight:bold;
      color:${color};
      font-family:sans-serif;
    ">${emoji}</div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  })
}

const userIcon = L.divIcon({
  className: 'mission-marker-icon',
  html: `<div style="
    width:16px;height:16px;
    background:#4a8fff;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 6px rgba(74,143,255,.2);
  "></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
})

// ── Tracé ─────────────────────────────────────────────────────────────────────

function getTrackCoords(sentier) {
  if (sentier?.gpx_track?.length >= 2)   return sentier.gpx_track
  if (sentier?.route_coords?.length >= 2) return sentier.route_coords
  return []
}

function closestIdx(coords, lat, lng) {
  let best = 0, bestD = Infinity
  for (let i = 0; i < coords.length; i++) {
    const d = (coords[i][0]-lat)**2 + (coords[i][1]-lng)**2
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

function RouteLayer({ coords, missions, collected, userPos, nextMissionId }) {
  if (!coords || coords.length < 2) return null
  const ll = coords.map(c => [c[0], c[1]])

  let splitIdx = 0
  missions.forEach(m => {
    if (!collected.includes(m.id)) return
    const idx = closestIdx(coords, m.lat, m.lng)
    if (idx > splitIdx) splitIdx = idx
  })
  if (userPos) {
    const idx = closestIdx(coords, userPos[0], userPos[1])
    if (idx > splitIdx) splitIdx = idx
  }

  const done      = splitIdx > 0 ? ll.slice(0, splitIdx + 1) : []
  const remaining = ll.slice(splitIdx)

  return (
    <>
      {remaining.length >= 2 && (
        <Polyline positions={remaining} pathOptions={{ color: '#c8a86e', weight: 3, opacity: 0.8, dashArray: '8,5' }} />
      )}
      {done.length >= 2 && (
        <Polyline positions={done} pathOptions={{ color: '#4a6b3a', weight: 4, opacity: 0.95 }} />
      )}
    </>
  )
}

function RecenterMap({ position }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (position && !done.current) { map.setView(position, 15); done.current = true }
  }, [position, map])
  return null
}

// ── Profil altimétrique ───────────────────────────────────────────────────────

function ElevationProfile({ coords, userIdx, sentierInfo }) {
  const W = 300, H = 68
  const hasEle = coords.length > 0 && coords[0].length >= 3

  // Élévations : réelles ou synthétiques
  let eles
  if (hasEle) {
    eles = coords.map(c => c[2])
  } else {
    // Profil synthétique basé sur les infos du sentier (montée progressive → pic → descente)
    const N = Math.max(coords.length, 40)
    const peakEle  = sentierInfo?.peak_ele  || 600
    const startEle = sentierInfo?.start_ele || 300
    eles = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1)
      if (t < 0.72) return startEle + (t / 0.72) * (peakEle - startEle)
      return peakEle - ((t - 0.72) / 0.28) * (peakEle - startEle) * 0.45
    })
  }

  const minEle = Math.min(...eles)
  const maxEle = Math.max(...eles)
  const range  = maxEle - minEle || 1
  const N      = eles.length

  const toX = i => (i / (N - 1)) * W
  const toY = e => H - 4 - ((e - minEle) / range) * (H - 12)

  const pathD = eles.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e).toFixed(1)}`).join(' ')

  // Position explorateur sur le profil
  const progIdx = hasEle ? userIdx : Math.round((userIdx / Math.max(1, coords.length - 1)) * (N - 1))
  const px = toX(Math.min(progIdx, N - 1))
  const py = toY(eles[Math.min(progIdx, N - 1)])
  const currentEle = Math.round(eles[Math.min(progIdx, N - 1)])

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: H, display: 'block' }}
      >
        <defs>
          <linearGradient id="ele-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#b8862e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#b8862e" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {/* Remplissage sous la courbe */}
        <path d={`${pathD} L${W},${H} L0,${H} Z`} fill="url(#ele-grad)" />
        {/* Courbe */}
        <path d={pathD} fill="none" stroke="#b8862e" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Ligne verticale position */}
        <line x1={px} y1="0" x2={px} y2={H} stroke="rgba(244,236,216,0.35)" strokeWidth="1" strokeDasharray="3,3" />
        {/* Point position */}
        <circle cx={px} cy={py} r="3.5" fill="#f4ecd8" stroke="#b8862e" strokeWidth="1.5" />
      </svg>
      {/* Labels bas */}
      <div className="flex items-center justify-between mt-1">
        <span className="font-mono" style={{ fontSize: 9, color: '#5a5048' }}>0 km</span>
        <span className="font-mono" style={{ fontSize: 9, color: '#b8862e' }}>
          Tu es ici · {currentEle} m
        </span>
        <span className="font-mono" style={{ fontSize: 9, color: '#5a5048' }}>{sentierInfo?.distance_km ?? '?'} km</span>
      </div>
    </div>
  )
}

// ── Chip météo ────────────────────────────────────────────────────────────────

function WeatherOverlay({ lat, lng }) {
  const weather = useWeather(lat, lng)
  if (!weather) return null
  return (
    <div
      className="absolute top-2.5 right-2.5 z-[500] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-sm"
      style={{ background: 'rgba(20,18,14,.78)', border: '1px solid rgba(184,134,46,.4)', fontSize: 13, color: '#f4ecd8' }}
    >
      <span>{weather.emoji}</span>
      <span className="font-title font-bold">{weather.temp}°</span>
    </div>
  )
}

// ── HikeScreen ────────────────────────────────────────────────────────────────

export default function HikeScreen({ sentier, missions, collected, onBack, onUnlockMission }) {
  const [userPos,           setUserPos]           = useState(null)
  const [nearbyMission,     setNearbyMission]     = useState(null)
  const [approachingMission,setApproachingMission]= useState(null)
  const [elapsed,           setElapsed]           = useState(0)
  const [expanded,          setExpanded]          = useState(false)
  const [ttsPlaying,        setTtsPlaying]        = useState(false)
  const utteranceRef = useRef(null)
  const watchRef     = useRef(null)
  const startRef     = useRef(Date.now())

  const completedCount = missions.filter(m => collected.includes(m.id)).length
  const nextMission    = missions.find(m => !collected.includes(m.id))
  const narrative      = useMissionNarrative(nextMission?.id)

  const trackCoords    = getTrackCoords(sentier)
  const mapCenter      = userPos || [sentier.lat_depart, sentier.lng_depart]
  const userTrackIdx   = userPos ? closestIdx(trackCoords, userPos[0], userPos[1]) : 0

  const distToNext = userPos && nextMission
    ? Math.round(distanceMetres(userPos[0], userPos[1], nextMission.lat, nextMission.lng))
    : null

  const elapsedLabel = `${Math.floor(elapsed / 3600)}h${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}`

  // ── GPS watch ──
  useEffect(() => {
    if (!navigator.geolocation) return
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserPos([lat, lng])
        const found = missions.find(m =>
          !collected.includes(m.id) && distanceMetres(lat, lng, m.lat, m.lng) <= (m.rayon_metres || 50)
        )
        setNearbyMission(found || null)
        const approaching = found ? null : missions.find(m => {
          if (collected.includes(m.id)) return false
          const d = distanceMetres(lat, lng, m.lat, m.lng)
          return d > (m.rayon_metres || 50) && d <= (m.rayon_approche_metres || 150)
        })
        setApproachingMission(approaching || null)
      },
      err => console.warn('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
  }, [missions, collected])

  // ── Timer ──
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  // ── TTS ──
  function toggleTts() {
    if (ttsPlaying) {
      window.speechSynthesis.cancel()
      setTtsPlaying(false)
      return
    }
    const text = narrative?.journal_text || nextMission?.texte
    if (!text || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'; u.rate = 0.95
    u.onend = () => setTtsPlaying(false)
    utteranceRef.current = u
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setTtsPlaying(true)
  }

  const activeCard = nearbyMission ?? approachingMission

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar font-body"
      style={{ background: '#181c17', color: '#f4ecd8' }}
    >

      {/* ── TOP BAR sticky ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4"
        style={{ height: 52, background: '#181c17', borderBottom: '1px solid rgba(244,236,216,0.06)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full grid place-items-center cursor-pointer"
          style={{ background: 'rgba(244,236,216,0.08)', border: '1px solid rgba(244,236,216,0.18)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2 L4 7 L9 12" stroke="#f4ecd8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(244,236,216,0.08)', border: '1px solid rgba(244,236,216,0.18)' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#a14a3c', animation: 'fadeIn 1s infinite alternate' }} />
          <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: 1.5 }}>
            En rando · {elapsedLabel}
          </span>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* ── HUD CHIPS ── */}
      <div className="flex gap-3 px-4 pt-3 pb-2">
        <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: 'rgba(244,236,216,0.07)', border: '1px solid rgba(244,236,216,0.11)' }}>
          <div className="font-mono uppercase mb-0.5" style={{ fontSize: 8, letterSpacing: 1.5, color: '#6a6558' }}>✦ Missions</div>
          <div className="font-title font-bold leading-none" style={{ fontSize: 24 }}>{completedCount}/{missions.length}</div>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2.5 text-right" style={{ background: 'rgba(244,236,216,0.07)', border: '1px solid rgba(244,236,216,0.11)' }}>
          <div className="font-mono uppercase mb-0.5" style={{ fontSize: 8, letterSpacing: 1.5, color: '#6a6558' }}>📍 Prochaine</div>
          <div className="font-title font-bold leading-none" style={{ fontSize: 24 }}>
            {distToNext != null
              ? distToNext >= 1000 ? `${(distToNext / 1000).toFixed(1)} km` : `${distToNext} m`
              : '— m'}
          </div>
        </div>
      </div>

      {/* ── CARTE ── */}
      <div className="px-4">
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: 16, height: 290, border: '1px solid rgba(244,236,216,0.08)' }}
        >
          <MapContainer center={mapCenter} zoom={14} zoomControl={false} className="w-full h-full">
            <TileLayer
              attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap position={userPos} />
            <RouteLayer
              coords={trackCoords}
              missions={missions}
              collected={collected}
              userPos={userPos}
              nextMissionId={nextMission?.id}
            />
            {userPos && (
              <>
                <Marker position={userPos} icon={userIcon} />
                <Circle center={userPos} radius={30} pathOptions={{ color: '#4a8fff', fillColor: '#4a8fff', fillOpacity: 0.1, weight: 1 }} />
              </>
            )}
            {missions.map(m => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={missionIcon(collected.includes(m.id), m.id === nextMission?.id, m)}
              />
            ))}
          </MapContainer>

          {/* Météo */}
          <WeatherOverlay lat={sentier.lat_depart} lng={sentier.lng_depart} />

          {/* Nom du sentier */}
          <div
            className="absolute bottom-2.5 left-2.5 z-[500] px-2.5 py-1.5 rounded-xl backdrop-blur-sm font-mono uppercase"
            style={{ background: 'rgba(20,18,14,.72)', border: '1px solid rgba(244,236,216,.12)', fontSize: 9, letterSpacing: 1.2, color: '#c9b78a' }}
          >
            📍 {sentier.nom}
          </div>

          {/* GPS en attente */}
          {!userPos && (
            <div
              className="absolute top-2.5 left-2.5 z-[500] px-2.5 py-1.5 rounded-xl font-body"
              style={{ background: 'rgba(20,18,14,.85)', color: '#c9b78a', fontSize: 11 }}
            >
              🔄 GPS en attente…
            </div>
          )}
        </div>
      </div>

      {/* ── PROFIL ALTIMÉTRIQUE ── */}
      <div className="px-4 mt-3">
        <div
          className="rounded-2xl px-4 pt-3 pb-3"
          style={{ background: 'rgba(244,236,216,0.04)', border: '1px solid rgba(244,236,216,0.08)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: 1.5, color: '#6a6558' }}>
              Profil du parcours
            </span>
            {trackCoords.length > 0 && trackCoords[0].length >= 3 && (
              <span className="font-mono" style={{ fontSize: 9, color: '#b8862e' }}>
                ↑ {Math.round(Math.max(...trackCoords.map(c => c[2])) - Math.min(...trackCoords.map(c => c[2])))} m
              </span>
            )}
          </div>
          <ElevationProfile
            coords={trackCoords}
            userIdx={userTrackIdx}
            sentierInfo={sentier}
          />
        </div>
      </div>

      {/* ── CARNET / ÉTAT MISSION ── */}
      <div className="px-4 mt-3 mb-6">

        {/* ── NEARBY : mission accessible ── */}
        {nearbyMission ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#f4ecd8', border: '2px solid #a14a3c', boxShadow: '3px 3px 0 #a14a3c' }}
          >
            <div className="flex items-center gap-3 mb-3.5">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center text-2xl flex-none"
                style={{ background: '#a14a3c', border: '1.5px solid #2b2620' }}
              >
                {nearbyMission.icone || CATEGORY_EMOJI[nearbyMission.categorie] || '🎯'}
              </div>
              <div>
                <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 8, letterSpacing: 1.5 }}>✦ Mission à portée !</div>
                <div className="font-title font-bold text-ink leading-none" style={{ fontSize: 22 }}>{nearbyMission.titre}</div>
              </div>
            </div>
            <button
              onClick={() => onUnlockMission(nearbyMission)}
              className="w-full h-12 cursor-pointer font-title font-bold flex items-center justify-center gap-2"
              style={{ background: '#2b2620', color: '#f4ecd8', border: 'none', borderRadius: 12, fontSize: 18, boxShadow: '2px 2px 0 #a14a3c' }}
            >
              Ouvrir la mission →
            </button>
          </div>

        ) : approachingMission ? (
          /* ── APPROACHING : teaser ── */
          <div
            className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg,#1c1a14,#2b2620)', border: '1.5px solid #b8862e', boxShadow: '3px 3px 0 #b8862e' }}
          >
            <div className="flex items-center gap-3 mb-3.5">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center text-2xl flex-none"
                style={{ background: 'rgba(184,134,46,.15)', border: '1.5px solid #b8862e', animation: 'missionGlowPulse 1.6s ease-in-out infinite' }}
              >
                👁
              </div>
              <div>
                <div className="font-mono uppercase mb-0.5" style={{ fontSize: 8, letterSpacing: 1.5, color: '#b8862e' }}>✦ Tu approches de quelque chose…</div>
                <div className="font-title font-bold leading-none" style={{ fontSize: 17, color: '#f4ecd8' }}>
                  Ouvre tes sens, continue dans cette direction
                </div>
              </div>
            </div>
            <button
              onClick={() => onUnlockMission(approachingMission)}
              className="w-full h-11 cursor-pointer font-title font-bold flex items-center justify-center gap-2"
              style={{ background: '#b8862e', color: '#1c1a14', border: 'none', borderRadius: 12, fontSize: 16 }}
            >
              Ouvrir →
            </button>
          </div>

        ) : nextMission ? (
          /* ── CARNET NARRATIF — prochaine mission ── */
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#f4ecd8', border: '1.5px solid #c9b78a', boxShadow: '3px 3px 0 #b8862e' }}
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center text-2xl flex-none"
                style={{ background: '#a14a3c', border: '1.5px solid #2b2620' }}
              >
                {nextMission.icone || CATEGORY_EMOJI[nextMission.categorie] || '🎯'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 8, letterSpacing: 1.3 }}>
                  Prochaine mission{narrative ? ` · Page ${narrative.page_number} du carnet` : ''}
                </div>
                <div className="font-title font-bold text-ink leading-none" style={{ fontSize: 20 }}>
                  {nextMission.titre}
                </div>
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ height: 1, background: '#d9c79a', margin: '0 16px' }} />

            {/* Extrait du carnet */}
            {(narrative?.journal_text || nextMission.texte) && (
              <div className="px-4 pt-3 pb-1">
                <p className="m-0 font-journal text-ink leading-snug" style={{ fontSize: 17 }}>
                  📖 «&nbsp;
                  {expanded
                    ? (narrative?.journal_text || nextMission.texte)
                    : (narrative?.journal_text || nextMission.texte).slice(0, 110) + '…'}
                  &nbsp;»
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2 px-4 pb-4 pt-2.5">
              <button
                onClick={toggleTts}
                className="flex-1 h-10 cursor-pointer font-label flex items-center justify-center gap-1.5 rounded-xl"
                style={{
                  background: ttsPlaying ? '#a14a3c' : '#2b2620',
                  color: '#f4ecd8', border: 'none', fontSize: 13,
                }}
              >
                {ttsPlaying ? (
                  <><svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="2.5" height="6" fill="currentColor"/><rect x="5.5" y="2" width="2.5" height="6" fill="currentColor"/></svg> Stop</>
                ) : (
                  <><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9 Z" fill="currentColor"/></svg> Écouter</>
                )}
              </button>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex-1 h-10 cursor-pointer font-label flex items-center justify-center rounded-xl"
                style={{ background: '#fff8e6', color: '#2b2620', border: '1.5px solid #c9b78a', fontSize: 13 }}
              >
                {expanded ? 'Réduire ↑' : 'Lire la suite →'}
              </button>
            </div>
          </div>

        ) : (
          /* ── SENTIER TERMINÉ ── */
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: '#f4ecd8', border: '1.5px solid #4a6b3a', boxShadow: '3px 3px 0 #4a6b3a' }}
          >
            <div style={{ fontSize: 42 }}>🏆</div>
            <div className="font-title font-bold text-ink mt-2" style={{ fontSize: 28 }}>Sentier terminé !</div>
            <p className="font-body text-ink-soft mt-1 m-0" style={{ fontSize: 14 }}>
              Toutes les missions ont été complétées.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
