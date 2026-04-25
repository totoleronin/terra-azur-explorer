import React, { useState } from 'react'
import BottomNav from './components/BottomNav'
import ExploreScreen from './screens/ExploreScreen'
import TrailDetailScreen from './screens/TrailDetailScreen'
import HikeScreen from './screens/HikeScreen'
import MissionScreen from './screens/MissionScreen'
import CollectionScreen from './screens/CollectionScreen'
import ProfilScreen from './screens/ProfilScreen'

// Pile de navigation : 'explore' | 'trail-detail' | 'hike' | 'mission'
export default function App() {
  const [tab, setTab]               = useState('explore')
  const [screen, setScreen]         = useState('explore')
  const [selectedTrail, setSelectedTrail]   = useState(null)
  const [activeMissions, setActiveMissions] = useState([])
  const [activeMission, setActiveMission]   = useState(null)

  const [collected, setCollected] = useState(() => {
    try { return JSON.parse(localStorage.getItem('collected') || '[]') }
    catch { return [] }
  })

  function collect(missionId) {
    setCollected(prev => {
      if (prev.includes(missionId)) return prev
      const next = [...prev, missionId]
      localStorage.setItem('collected', JSON.stringify(next))
      return next
    })
  }

  // ── Transitions d'écrans ──────────────────────────────────────────

  function goToTrailDetail(trail) {
    setSelectedTrail(trail)
    setScreen('trail-detail')
  }

  function goToHike(trail, missions) {
    setSelectedTrail(trail)
    setActiveMissions(missions)
    setScreen('hike')
  }

  function goToMission(mission) {
    setActiveMission(mission)
    setScreen('mission')
  }

  function completeMission(missionId) {
    collect(missionId)
    setScreen('hike')   // retour à la carte rando
    setActiveMission(null)
  }

  function goBack() {
    if (screen === 'mission')      setScreen('hike')
    else if (screen === 'hike')    setScreen('trail-detail')
    else if (screen === 'trail-detail') { setScreen('explore'); setSelectedTrail(null) }
  }

  // La barre de nav disparaît en mode rando/mission
  const showNav = screen === 'explore' || screen === 'trail-detail' ||
                  (screen === 'collection' || screen === 'profil')

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── Écran 4 — Fiche mission ── */}
      {screen === 'mission' && (
        <div className="absolute inset-0 z-50">
          <MissionScreen
            mission={activeMission}
            onComplete={completeMission}
            onClose={() => setScreen('hike')}
          />
        </div>
      )}

      {/* ── Écran 3 — Mode rando GPS ── */}
      {screen === 'hike' && (
        <div className="absolute inset-0 z-40">
          <HikeScreen
            sentier={selectedTrail}
            missions={activeMissions}
            collected={collected}
            onBack={() => setScreen('trail-detail')}
            onUnlockMission={goToMission}
          />
        </div>
      )}

      {/* ── Écran 2 — Détail sentier ── */}
      {screen === 'trail-detail' && (
        <div className="absolute inset-0 z-30">
          <TrailDetailScreen
            sentier={selectedTrail}
            collected={collected}
            onStart={goToHike}
            onBack={() => { setScreen('explore'); setSelectedTrail(null) }}
          />
        </div>
      )}

      {/* ── Écran 1 — Carte exploration ── */}
      <div className={`absolute inset-0 ${tab === 'explore' && screen === 'explore' ? 'block' : 'hidden'}`}>
        <ExploreScreen onViewTrail={goToTrailDetail} />
      </div>

      {/* ── Collection ── */}
      <div className={`absolute inset-0 ${tab === 'collection' && screen === 'explore' ? 'block' : 'hidden'}`}>
        <CollectionScreen collected={collected} />
      </div>

      {/* ── Profil ── */}
      <div className={`absolute inset-0 ${tab === 'profil' && screen === 'explore' ? 'block' : 'hidden'}`}>
        <ProfilScreen collected={collected} />
      </div>

      {/* ── Barre de navigation ── */}
      {screen === 'explore' && (
        <BottomNav active={tab} onChange={t => { setTab(t); setScreen('explore') }} />
      )}
    </div>
  )
}
