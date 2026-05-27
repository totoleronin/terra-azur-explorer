import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { distanceMetres } from '../lib/geo'
import { useMissionNarrative } from '../hooks/useNarrative'
import { useWeather } from '../hooks/useWeather'
import { supabase } from '../lib/supabase'

// ── Icônes Leaflet — cercle minimaliste + numéro de page ──────────────────────

function missionIcon(done, isApproaching, isNearby, pageNum) {
  let halo = ''
  if (isNearby) {
    halo = `<div style="
      position:absolute;inset:-16px;border-radius:50%;
      background:rgba(161,74,60,0.22);border:2px solid rgba(161,74,60,0.7);
      animation:missionGlowPulse 0.75s ease-in-out infinite;pointer-events:none;
    "></div>`
  } else if (isApproaching) {
    halo = `<div style="
      position:absolute;inset:-12px;border-radius:50%;
      background:rgba(184,134,46,0.13);border:2px solid rgba(184,134,46,0.55);
      animation:missionGlowPulse 1.7s ease-in-out infinite;pointer-events:none;
    "></div>`
  }

  const symbol = done ? '✓' : '?'
  const bg     = done ? '#4a6b3a' : isNearby ? '#a14a3c' : '#1e1b18'
  const border = done
    ? 'rgba(201,183,138,0.55)' : isNearby
    ? 'rgba(244,236,216,0.7)'  : 'rgba(201,183,138,0.35)'
  const pageLabel = pageNum != null ? `p.${pageNum}` : ''

  return L.divIcon({
    className: 'mission-marker-icon',
    html: `<div style="position:relative;width:36px;height:50px;display:flex;flex-direction:column;align-items:center;gap:2px;">
      ${halo}
      <div style="
        position:relative;z-index:2;
        width:36px;height:36px;
        background:${bg};
        border:1.5px solid ${border};
        box-shadow:0 2px 10px rgba(0,0,0,0.65),0 0 0 1px rgba(0,0,0,0.3);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:15px;font-weight:700;
        color:#f4ecd8;
        font-family:Inter,sans-serif;
      ">${symbol}</div>
      ${pageLabel ? `<div style="
        position:relative;z-index:2;
        font-size:9px;color:rgba(244,236,216,0.85);
        font-family:'Lora',serif;letter-spacing:0.3px;
        text-shadow:0 1px 3px rgba(0,0,0,0.9);
        white-space:nowrap;
      ">${pageLabel}</div>` : ''}
    </div>`,
    iconSize: [36, 50],
    iconAnchor: [18, 18],
  })
}

const userIcon = L.divIcon({
  className: 'mission-marker-icon',
  html: `<div style="position:relative;width:16px;height:16px;">
    <div style="position:absolute;inset:-10px;border-radius:50%;background:rgba(74,143,255,0.13);pointer-events:none;"></div>
    <div style="width:16px;height:16px;background:#4a8fff;border:3px solid #fff;border-radius:50%;
      box-shadow:0 0 8px rgba(74,143,255,0.5);position:relative;z-index:2;"></div>
  </div>`,
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
    const d = (coords[i][0] - lat) ** 2 + (coords[i][1] - lng) ** 2
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

function RouteLayer({ coords, missions, collected, userPos }) {
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
        <Polyline positions={remaining} pathOptions={{ color: '#c8a86e', weight: 3, opacity: 0.85, dashArray: '8,5' }} />
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

// ── Profil altimétrique (overlay bas) ────────────────────────────────────────

function ElevationOverlay({ coords, userIdx, sentierInfo }) {
  const W = 400, H = 50
  const hasEle = coords.length > 0 && coords[0].length >= 3

  let eles
  if (hasEle) {
    eles = coords.map(c => c[2])
  } else {
    const N       = Math.max(coords.length, 40)
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
  const toY = e => H - 2 - ((e - minEle) / range) * (H - 8)

  const pathD = eles.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e).toFixed(1)}`).join(' ')

  const progIdx    = hasEle ? userIdx : Math.round((userIdx / Math.max(1, coords.length - 1)) * (N - 1))
  const safeIdx    = Math.min(progIdx, N - 1)
  const px         = toX(safeIdx)
  const py         = toY(eles[safeIdx])
  const currentEle = Math.round(eles[safeIdx])

  return (
    <div className="w-full h-full flex flex-col justify-end px-4 pb-1 pt-1" style={{ pointerEvents: 'none' }}>
      <div className="flex justify-between mb-0.5">
        <span style={{ fontSize: 9, color: 'rgba(201,183,138,0.5)', fontFamily: 'Lora, serif' }}>0 km</span>
        <span style={{ fontSize: 9, color: '#b8862e',             fontFamily: 'Lora, serif' }}>📍 {currentEle} m</span>
        <span style={{ fontSize: 9, color: 'rgba(201,183,138,0.5)', fontFamily: 'Lora, serif' }}>{sentierInfo?.distance_km ?? '?'} km</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id="ele-overlay-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#b8862e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#b8862e" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L${W},${H} L0,${H} Z`} fill="url(#ele-overlay-grad)" />
        <path d={pathD} fill="none" stroke="#b8862e" strokeWidth="2" strokeLinejoin="round" />
        <line x1={px} y1="0" x2={px} y2={H} stroke="rgba(244,236,216,0.4)" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx={px} cy={py} r="3.5" fill="#f4ecd8" stroke="#b8862e" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

// ── Météo ─────────────────────────────────────────────────────────────────────

function WeatherChip({ lat, lng }) {
  const weather = useWeather(lat, lng)
  if (!weather) return null
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-none"
      style={{
        background: 'rgba(10,13,8,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(184,134,46,0.35)',
        fontSize: 13, color: '#f4ecd8',
      }}
    >
      <span>{weather.emoji}</span>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, lineHeight: 1 }}>{weather.temp}°</span>
    </div>
  )
}

// ── HikeScreen ────────────────────────────────────────────────────────────────

export default function HikeScreen({ sentier, missions, collected, onBack, onUnlockMission }) {
  const [userPos,            setUserPos]            = useState(null)
  const [nearbyMission,      setNearbyMission]      = useState(null)
  const [approachingMission, setApproachingMission] = useState(null)
  const [elapsed,            setElapsed]            = useState(0)
  const [drawerOpen,         setDrawerOpen]         = useState(false)
  const [ttsPlaying,         setTtsPlaying]         = useState(false)
  const [expanded,           setExpanded]           = useState(false)
  // Tracé frais depuis Supabase — remplace toujours la version en cache de l'app
  const [liveSentier,        setLiveSentier]        = useState(sentier)

  const watchRef         = useRef(null)
  const startRef         = useRef(Date.now())
  const utteranceRef     = useRef(null)
  const touchStartY      = useRef(null)
  const autoOpenedKeyRef = useRef(null)

  // ── Rechargement du tracé GPX depuis Supabase au montage ──
  useEffect(() => {
    if (!sentier?.id) return
    supabase
      .from('sentiers')
      .select('gpx_track, route_coords, lat_depart, lng_depart, distance_km, nom, peak_ele, start_ele')
      .eq('id', sentier.id)
      .single()
      .then(({ data }) => { if (data) setLiveSentier(prev => ({ ...prev, ...data })) })
  }, [sentier?.id])

  const completedCount = missions.filter(m => collected.includes(m.id)).length
  const nextMission    = missions.find(m => !collected.includes(m.id))

  // Mission active pour le drawer (nearby prime sur approaching)
  const drawerMission = nearbyMission ?? approachingMission

  const narrative    = useMissionNarrative(drawerMission?.id)
  const trackCoords  = getTrackCoords(liveSentier)
  const mapCenter    = userPos || [liveSentier.lat_depart, liveSentier.lng_depart]
  const userTrackIdx = userPos ? closestIdx(trackCoords, userPos[0], userPos[1]) : 0

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
          return d > (m.rayon_metres || 50) && d <= (m.rayon_approche_metres || 200)
        })
        setApproachingMission(approaching || null)
      },
      err => console.warn('GPS:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
  }, [missions, collected])

  // ── Auto-ouverture du drawer ──
  useEffect(() => {
    if (nearbyMission) {
      // Toujours forcer l'ouverture à 50m (même si l'explorateur avait fermé)
      const key = `nearby-${nearbyMission.id}`
      if (autoOpenedKeyRef.current !== key) {
        setDrawerOpen(true)
        setExpanded(false)
        autoOpenedKeyRef.current = key
      }
    } else if (approachingMission) {
      // N'ouvrir qu'une seule fois par mission (ne rouvre pas si l'explorateur a fermé)
      const key = `approaching-${approachingMission.id}`
      if (autoOpenedKeyRef.current !== key) {
        setDrawerOpen(true)
        setExpanded(false)
        autoOpenedKeyRef.current = key
      }
    } else {
      // Hors de tout rayon : fermer le drawer
      setDrawerOpen(false)
      autoOpenedKeyRef.current = null
    }
  }, [nearbyMission?.id, approachingMission?.id])

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
    const text = narrative?.journal_text || drawerMission?.texte
    if (!text || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'; u.rate = 0.95
    u.onend = () => setTtsPlaying(false)
    utteranceRef.current = u
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setTtsPlaying(true)
  }

  // ── Fermer le drawer ──
  function closeDrawer() {
    setDrawerOpen(false)
    if (ttsPlaying) { window.speechSynthesis.cancel(); setTtsPlaying(false) }
  }

  // ── Swipe bas pour fermer ──
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (touchStartY.current === null) return
    if (e.changedTouches[0].clientY - touchStartY.current > 65) closeDrawer()
    touchStartY.current = null
  }

  const pillPage  = narrative?.page_number
  const showPill  = !drawerOpen && !!drawerMission
  const pillLabel = drawerMission
    ? `📖 ${pillPage ? `Page ${pillPage} du carnet` : drawerMission.titre} — Toucher pour lire`
    : null

  const distToDrawer = userPos && drawerMission
    ? Math.round(distanceMetres(userPos[0], userPos[1], drawerMission.lat, drawerMission.lng))
    : null

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden font-body" style={{ background: '#0d1009' }}>

      {/* ══ CARTE PLEIN ÉCRAN ══ */}
      <div className="absolute inset-0">
        <MapContainer
          center={mapCenter} zoom={14} zoomControl={false}
          className="w-full h-full"
          style={{ background: '#1a1f15' }}
        >
          <TileLayer
            attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap position={userPos} />
          <RouteLayer coords={trackCoords} missions={missions} collected={collected} userPos={userPos} />
          {userPos && (
            <>
              <Marker position={userPos} icon={userIcon} />
              <Circle center={userPos} radius={30}
                pathOptions={{ color: '#4a8fff', fillColor: '#4a8fff', fillOpacity: 0.08, weight: 1 }} />
            </>
          )}
          {missions.map(m => {
            const done       = collected.includes(m.id)
            const isNearby   = !done && nearbyMission?.id    === m.id
            const isApproach = !done && approachingMission?.id === m.id
            return (
              <Marker key={m.id} position={[m.lat, m.lng]}
                icon={missionIcon(done, isApproach, isNearby, m.page_number ?? (missions.indexOf(m) + 1))} />
            )
          })}
        </MapContainer>
      </div>

      {/* ══ BARRE HAUTE flottante ══ */}
      <div
        className="absolute top-0 left-0 right-0 z-[500] flex items-center justify-between px-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))', paddingBottom: 10 }}
      >
        {/* Retour */}
        <button onClick={onBack}
          className="w-10 h-10 rounded-full grid place-items-center cursor-pointer flex-none"
          style={{
            background: 'rgba(10,13,8,0.72)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(244,236,216,0.2)',
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2 L4 7 L9 12" stroke="#f4ecd8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Chrono */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full"
          style={{
            background: 'rgba(10,13,8,0.72)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(244,236,216,0.18)',
          }}>
          <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: '#a14a3c', animation: 'fadeIn 1s infinite alternate' }} />
          <span style={{ fontSize: 10, letterSpacing: 1.5, color: '#f4ecd8', fontFamily: 'Lora, serif', textTransform: 'uppercase' }}>
            En rando · {elapsedLabel}
          </span>
        </div>

        {/* Météo */}
        <WeatherChip lat={liveSentier.lat_depart} lng={liveSentier.lng_depart} />
      </div>

      {/* ══ CHIPS HUD ══ */}
      <div
        className="absolute left-0 right-0 z-[500] flex gap-3 px-4"
        style={{ top: 'max(68px, calc(env(safe-area-inset-top, 16px) + 52px))' }}
      >
        {/* Missions */}
        <div className="flex-1 px-3.5 py-2.5 rounded-2xl"
          style={{
            background: 'rgba(10,13,8,0.65)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(244,236,216,0.1)',
          }}>
          <div style={{ fontSize: 8, letterSpacing: 1.5, color: 'rgba(201,183,138,0.55)', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginBottom: 2 }}>✦ Missions</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, lineHeight: 1, color: '#f4ecd8' }}>{completedCount}/{missions.length}</div>
        </div>

        {/* Prochaine */}
        <div className="flex-1 px-3.5 py-2.5 rounded-2xl text-right"
          style={{
            background: 'rgba(10,13,8,0.65)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(244,236,216,0.1)',
          }}>
          <div style={{ fontSize: 8, letterSpacing: 1.5, color: 'rgba(201,183,138,0.55)', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginBottom: 2 }}>📍 Prochaine</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, lineHeight: 1,
            color: distToNext != null && distToNext <= 200 ? '#b8862e' : '#f4ecd8',
          }}>
            {distToNext != null
              ? distToNext >= 1000 ? `${(distToNext / 1000).toFixed(1)} km` : `${distToNext} m`
              : '—'}
          </div>
        </div>
      </div>

      {/* ══ GPS en attente ══ */}
      {!userPos && (
        <div className="absolute z-[500] px-3 py-1.5 rounded-xl"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'rgba(10,13,8,0.82)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(184,134,46,0.3)', color: '#c9b78a', fontSize: 12,
          }}>
          🔄 GPS en attente…
        </div>
      )}

      {/* ══ PROFIL ALTIMÉTRIQUE — overlay bas ══ */}
      {!drawerOpen && trackCoords.length >= 2 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[500]"
          style={{
            height: 80,
            background: 'linear-gradient(to top, rgba(8,10,6,0.93) 55%, rgba(8,10,6,0) 100%)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            pointerEvents: 'none',
          }}
        >
          <ElevationOverlay coords={trackCoords} userIdx={userTrackIdx} sentierInfo={liveSentier} />
        </div>
      )}

      {/* ══ PILL NOTIFICATION ══ */}
      {showPill && pillLabel && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute z-[502] cursor-pointer"
          style={{
            bottom: 88, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,13,8,0.88)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(184,134,46,0.55)',
            borderRadius: 50, padding: '9px 20px',
            fontSize: 12, color: '#f4ecd8', whiteSpace: 'nowrap',
            boxShadow: '0 3px 20px rgba(0,0,0,0.45)',
          }}
        >
          {pillLabel}
        </button>
      )}

      {/* ══ DRAWER ══ */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="absolute left-0 right-0 z-[600]"
        style={{
          bottom: 0,
          transform: drawerOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
          background: '#f4ecd8',
          borderRadius: '22px 22px 0 0',
          boxShadow: '0 -6px 40px rgba(0,0,0,0.55)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* Poignée + fermer */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div style={{ width: 28 }} />
          <div className="w-10 h-1 rounded-full" style={{ background: '#c9b78a' }} />
          <button onClick={closeDrawer}
            className="w-7 h-7 rounded-full grid place-items-center cursor-pointer"
            style={{ background: 'rgba(43,38,32,0.1)', border: '1px solid rgba(43,38,32,0.15)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 2 L8 8 M8 2 L2 8" stroke="#5a4f42" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── NEARBY : mission à portée ── */}
        {nearbyMission ? (
          <div className="px-4 pb-5 pt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl flex-none"
                style={{ background: '#a14a3c', border: '1.5px solid #2b2620' }}>
                {nearbyMission.icone || CATEGORY_EMOJI[nearbyMission.categorie] || '🎯'}
              </div>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 1.5, color: '#8a7e6c', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginBottom: 3 }}>✦ Mission à portée !</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, lineHeight: 1, color: '#2b2620' }}>{nearbyMission.titre}</div>
              </div>
            </div>

            {(narrative?.journal_text || nearbyMission.texte) && (
              <>
                <div style={{ height: 1, background: '#d9c79a', marginBottom: 12 }} />
                <p className="font-journal text-ink leading-snug m-0 mb-4" style={{ fontSize: 16 }}>
                  📖 «&nbsp;{(narrative?.journal_text || nearbyMission.texte).slice(0, 130)}…&nbsp;»
                </p>
              </>
            )}

            <button
              onClick={() => { closeDrawer(); onUnlockMission(nearbyMission) }}
              className="w-full cursor-pointer flex items-center justify-center gap-2 font-title"
              style={{
                height: 52, background: '#2b2620', color: '#f4ecd8',
                border: 'none', borderRadius: 14, fontSize: 20,
                boxShadow: '2px 2px 0 #a14a3c',
                fontFamily: "'Bebas Neue', sans-serif",
              }}>
              Ouvrir la mission →
            </button>
          </div>

        ) : approachingMission ? (
          /* ── APPROACHING : carnet narratif ── */
          <div className="px-4 pb-5 pt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-xl flex-none"
                style={{ background: 'rgba(184,134,46,0.12)', border: '1.5px solid #c9b78a' }}>
                {approachingMission.icone || CATEGORY_EMOJI[approachingMission.categorie] || '🎯'}
              </div>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 1.5, color: '#b8862e', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginBottom: 3 }}>
                  ✦ Tu approches{distToDrawer != null ? ` — ${distToDrawer} m` : ''}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, lineHeight: 1, color: '#2b2620' }}>
                  {approachingMission.titre}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#d9c79a', marginBottom: 12 }} />

            {(narrative?.journal_text || approachingMission.texte) && (
              <div className="mb-4">
                {narrative?.page_number && (
                  <div style={{ fontSize: 8, letterSpacing: 1.3, color: '#8a7e6c', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginBottom: 8 }}>
                    Page {narrative.page_number} du carnet
                  </div>
                )}
                <p className="font-journal text-ink leading-snug m-0" style={{ fontSize: 17 }}>
                  📖 «&nbsp;
                  {expanded
                    ? (narrative?.journal_text || approachingMission.texte)
                    : (narrative?.journal_text || approachingMission.texte).slice(0, 160) + '…'}
                  &nbsp;»
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={toggleTts}
                className="flex-none h-11 px-4 cursor-pointer flex items-center gap-1.5 rounded-xl"
                style={{
                  background: ttsPlaying ? '#a14a3c' : '#2b2620',
                  color: '#f4ecd8', border: 'none', fontSize: 13, fontFamily: 'Lora, serif',
                }}>
                {ttsPlaying
                  ? <><svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="2.5" height="6" fill="currentColor"/><rect x="5.5" y="2" width="2.5" height="6" fill="currentColor"/></svg> Stop</>
                  : <><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9 Z" fill="currentColor"/></svg> Écouter</>}
              </button>
              <button onClick={() => setExpanded(e => !e)}
                className="flex-1 h-11 cursor-pointer flex items-center justify-center rounded-xl"
                style={{ background: '#fff8e6', color: '#2b2620', border: '1.5px solid #c9b78a', fontSize: 13, fontFamily: 'Lora, serif' }}>
                {expanded ? 'Réduire ↑' : 'Lire la suite →'}
              </button>
            </div>
          </div>

        ) : completedCount === missions.length ? (
          /* ── TERMINÉ ── */
          <div className="px-4 pb-6 pt-2 text-center">
            <div style={{ fontSize: 44 }}>🏆</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: '#2b2620', marginTop: 8 }}>
              Sentier terminé !
            </div>
            <p className="font-body m-0 mt-1" style={{ fontSize: 14, color: '#5a4f42' }}>
              Toutes les missions ont été complétées.
            </p>
          </div>

        ) : null}
      </div>
    </div>
  )
}
