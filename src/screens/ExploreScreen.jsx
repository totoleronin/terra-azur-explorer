import React, { useState, useMemo } from 'react'
import { useTrails, useAllMissions } from '../hooks/useTrails'
import { TrailIllustration } from '../components/Illustration'
import MiniMap from '../components/MiniMap'

const FILTERS = [
  { id: 'all',    label: 'Tous' },
  { id: 'family', label: 'Famille' },
  { id: 'short',  label: 'Court' },
  { id: 'sea',    label: 'Mer' },
  { id: 'forest', label: 'Forêt' },
]

const DIFF_TO_STARS = { Facile: 1, Famille: 1, Moyen: 2, Modéré: 2, Sportif: 3, Difficile: 3 }

function DiffDots({ n }) {
  return (
    <span className="inline-flex gap-0.5 items-center">
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full border border-ink"
          style={{ background: i <= n ? '#2b2620' : 'transparent' }}
        />
      ))}
    </span>
  )
}

function HeroBadge({ tone, children }) {
  const tones = {
    active: { bg: '#2b2620', fg: '#f4ecd8', dot: '#7fc6c2' },
    new:    { bg: '#b8862e', fg: '#f4ecd8' },
    gold:   { bg: '#b8862e', fg: '#f4ecd8' },
    green:  { bg: '#4a6b3a', fg: '#f4ecd8' },
  }
  const t = tones[tone] || tones.active
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full font-mono uppercase"
      style={{ background: t.bg, color: t.fg, fontSize: 9, letterSpacing: 1 }}
    >
      {tone === 'active' && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: t.dot, boxShadow: '0 0 0 2px rgba(127,198,194,0.3)' }}
        />
      )}
      {children}
    </span>
  )
}

function TrailCard({ trail, idx, onOpen }) {
  const diffStars = DIFF_TO_STARS[trail.difficulte] || 2
  const missionsCount = trail.missions_count ?? '✦'
  return (
    <article
      onClick={() => onOpen(trail)}
      className="relative cursor-pointer overflow-hidden rounded-2xl border bg-parchment-200 animate-cardIn"
      style={{
        borderColor: '#c9b78a',
        boxShadow: '0 1px 0 #fff inset, 0 6px 14px rgba(43,38,32,0.07)',
        animationDelay: `${0.08 + idx * 0.06}s`,
      }}
    >
      {/* illustration */}
      <div className="relative h-36 overflow-hidden">
        <TrailIllustration trail={trail} />
        <div className="absolute top-2.5 left-2.5">
          <HeroBadge tone={trail.badge_tone || 'gold'}>
            {trail.badge_label || trail.difficulte || 'Sentier'}
          </HeroBadge>
        </div>
        <div
          className="absolute top-2.5 right-2.5 px-2.5 py-[3px] rounded-full font-title font-bold backdrop-blur-sm border"
          style={{
            background: 'rgba(244,236,216,0.92)',
            borderColor: '#2b2620',
            color: '#2b2620',
            fontSize: 14,
          }}
        >
          ✦ {missionsCount} missions
        </div>
        <div
          className="absolute left-0 right-0 bottom-0 h-6"
          style={{ background: 'linear-gradient(to bottom, transparent, #f4ecd8)' }}
        />
      </div>

      {/* body */}
      <div className="px-3.5 pt-2.5 pb-3.5">
        <div className="font-mono uppercase text-ink-mute mb-0.5" style={{ fontSize: 9, letterSpacing: 1.5 }}>
          {trail.region || "Côte d'Azur"}
        </div>
        <h3 className="font-title font-bold text-ink m-0 leading-tight" style={{ fontSize: 24 }}>
          {trail.nom}
        </h3>
        <p className="font-body text-ink-soft mt-1 mb-2.5 leading-snug" style={{ fontSize: 14 }}>
          {trail.description}
        </p>

        <div
          className="flex items-center gap-2.5 pt-2 font-body text-ink"
          style={{ borderTop: '1px dashed #c9b78a', fontSize: 13 }}
        >
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 10 L5 4 L7 8 L10 2" stroke="#2b2620" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
            {trail.distance_km} km
          </span>
          <span className="w-px h-3 bg-parchment-400" />
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="4.5" stroke="#2b2620" strokeWidth="1.2" fill="none" />
              <path d="M6 3 L6 6 L8 7" stroke="#2b2620" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
            {trail.duree}
          </span>
          <span className="w-px h-3 bg-parchment-400" />
          <span className="inline-flex items-center gap-1">
            <DiffDots n={diffStars} />
            <span className="text-xs">{trail.difficulte}</span>
          </span>
          <span className="flex-1" />
          <span
            className="w-7 h-7 rounded-full grid place-items-center font-title font-bold"
            style={{ background: '#2b2620', color: '#f4ecd8', fontSize: 18 }}
          >
            ›
          </span>
        </div>
      </div>
    </article>
  )
}

export default function ExploreScreen({ onViewTrail, collected = [] }) {
  const { sentiers, loading } = useTrails()
  const { missions: allMissions } = useAllMissions()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const trailStates = useMemo(() => {
    const map = {}
    sentiers.forEach(s => {
      const trailMissions = allMissions.filter(m => m.sentier_id === s.id)
      const total = trailMissions.length
      const done = trailMissions.filter(m => collected.includes(m.id)).length
      if (total > 0 && done === total) map[s.id] = 'done'
      else if (done > 0) map[s.id] = 'active'
      else map[s.id] = 'available'
    })
    return map
  }, [sentiers, allMissions, collected])

  const visible = sentiers.filter(t => {
    if (search) {
      const q = search.toLowerCase()
      if (!(t.nom || '').toLowerCase().includes(q) && !(t.region || '').toLowerCase().includes(q)) return false
    }
    if (filter === 'family') return t.difficulte === 'Facile' || t.difficulte === 'Famille'
    if (filter === 'short')  return parseFloat(t.distance_km) < 5
    return true
  })

  return (
    <div className="relative w-full h-full overflow-hidden parchment-bg parchment-grain font-body text-ink">

      {/* HEADER fixed */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: 'linear-gradient(to bottom, rgba(244,236,216,0.95), rgba(244,236,216,0.5))',
          backdropFilter: 'blur(6px)',
          borderBottom: '1px solid rgba(43,38,32,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full grid place-items-center font-title font-bold border-2"
            style={{
              background: '#2b2620',
              color: '#b8862e',
              borderColor: '#2b2620',
              boxShadow: '0 0 0 2px #f4ecd8, 0 0 0 3px #2b2620',
              fontSize: 18,
            }}
          >
            T
          </div>
          <div className="leading-tight">
            <div className="font-title font-bold text-ink" style={{ fontSize: 18 }}>Terra Azur</div>
            <div className="font-mono text-ink-mute uppercase" style={{ fontSize: 8, letterSpacing: 1.5 }}>
              EXPLORER · v.1
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar" style={{ paddingTop: 56, paddingBottom: 88 }}>

        {/* HERO */}
        <header className="px-[18px] pt-2 pb-3.5 animate-fadeUp">
          <div className="font-mono uppercase text-ink-mute flex items-center gap-1.5" style={{ fontSize: 10, letterSpacing: 2 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a14a3c' }} />
            Bonjour, explorateur · {sentiers.length} sentiers
          </div>
          <h1 className="font-title font-bold text-ink m-0 leading-none mt-1" style={{ fontSize: 38, letterSpacing: -0.5 }}>
            Où partons-<br />
            <span style={{ color: '#a14a3c' }}>nous aujourd'hui ?</span>
          </h1>
        </header>

        {/* SEARCH */}
        <div className="px-[18px] pb-3.5">
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-[1.5px]"
            style={{
              background: '#f9f1de',
              borderColor: '#2b2620',
              boxShadow: '2px 2px 0 #2b2620',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5" stroke="#2b2620" strokeWidth="1.5" fill="none" />
              <path d="M11 11 L14 14" stroke="#2b2620" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Chercher un sentier, une région…"
              className="flex-1 bg-transparent outline-none border-none font-body text-ink"
              style={{ fontSize: 15 }}
            />
          </div>
        </div>

        {/* MINI-MAP */}
        <div className="px-[18px] pb-3.5">
          <MiniMap
            sentiers={sentiers}
            trailStates={trailStates}
            onPickTrail={onViewTrail}
            height={200}
          />
        </div>

        {/* FILTERS */}
        <div className="px-[18px] pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex-none inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-body cursor-pointer transition-all"
                style={{
                  background: active ? '#2b2620' : '#f9f1de',
                  color: active ? '#f4ecd8' : '#2b2620',
                  borderColor: '#2b2620',
                  fontSize: 14,
                  boxShadow: active ? 'none' : '1.5px 1.5px 0 #2b2620',
                  transform: active ? 'translate(1.5px, 1.5px)' : 'none',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* TRAIL LIST */}
        <div className="px-[18px] pb-3.5 flex flex-col gap-3.5">
          {loading && (
            <div className="text-center py-8 text-ink-mute font-body">Chargement des sentiers…</div>
          )}
          {!loading && visible.map((t, i) => (
            <TrailCard key={t.id} trail={t} idx={i} onOpen={onViewTrail} />
          ))}
          {!loading && visible.length === 0 && (
            <div
              className="p-6 text-center rounded-2xl text-ink-mute font-body"
              style={{ border: '1.5px dashed #8a7e6c' }}
            >
              Aucun sentier trouvé.<br />Essaie un autre filtre.
            </div>
          )}
        </div>

        <div className="px-[18px] pt-2 pb-1 text-center font-title text-ink-mute italic" style={{ fontSize: 16 }}>
          ~ Le carnet d'exploration ~
        </div>
      </div>
    </div>
  )
}
