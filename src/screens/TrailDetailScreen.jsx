import React, { useEffect, useRef, useState } from 'react'
import { useMissions } from '../hooks/useTrails'
import { TrailIllustration, MissionIllustration } from '../components/Illustration'

const DIFF_TO_STARS = { Facile: 1, Famille: 1, Moyen: 2, Modéré: 2, Sportif: 3, Difficile: 3 }

const MISSION_TYPE_LABELS = {
  Plante: 'observation',
  Animal: 'observation',
  'Géologie': 'observation',
  'Point de vue': 'observation',
}

function MissionIcon({ categorie }) {
  // Observation eye for all (matches design "observation" icon)
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M1 7 C 3 3 11 3 13 7 C 11 11 3 11 1 7 Z" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

function StatTile({ label, value, icon }) {
  return (
    <div
      className="rounded-xl p-3 min-w-0"
      style={{ background: '#f9f1de', border: '1px solid #c9b78a' }}
    >
      <div
        className="font-mono uppercase text-ink-mute flex items-center gap-1.5 mb-1"
        style={{ fontSize: 8, letterSpacing: 1.5 }}
      >
        {icon}
        {label}
      </div>
      <div
        className="font-title font-bold text-ink leading-none truncate"
        style={{ fontSize: 22 }}
      >
        {value}
      </div>
    </div>
  )
}

// state: 'unlocked' (collected) | 'nearby' (active next-up) | 'locked' (not yet)
function MissionCheckpoint({ mission, idx, total, state }) {
  const isLast = idx === total - 1
  const dotColors = {
    unlocked: { bg: '#4a6b3a', fg: '#f4ecd8' },
    nearby:   { bg: '#a14a3c', fg: '#f4ecd8' },
    locked:   { bg: '#ebe0c2', fg: '#8a7e6c' },
  }
  const c = dotColors[state]

  return (
    <div className="relative flex gap-3.5" style={{ paddingBottom: isLast ? 0 : 14 }}>
      {/* Timeline dot */}
      <div className="relative flex-none" style={{ width: 28 }}>
        <div
          className="w-7 h-7 rounded-full grid place-items-center font-title font-bold border-[1.5px] border-ink relative z-[2]"
          style={{
            background: c.bg,
            color: c.fg,
            fontSize: 14,
            ...(state === 'nearby' ? { boxShadow: '0 0 0 4px rgba(161,74,60,0.18)' } : {}),
          }}
        >
          {state === 'unlocked' ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 6 L5 9 L10 3" stroke={c.fg} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : state === 'locked' ? (
            <svg width="11" height="11" viewBox="0 0 12 12">
              <rect x="3" y="5.5" width="6" height="5" rx="0.8" stroke={c.fg} strokeWidth="1.2" fill="none" />
              <path d="M4.2 5.5 V 4 a 1.8 1.8 0 0 1 3.6 0 V 5.5" stroke={c.fg} strokeWidth="1.2" fill="none" />
            </svg>
          ) : (
            idx + 1
          )}
        </div>
        {!isLast && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-[1]"
            style={{
              top: 28,
              bottom: -14,
              width: 2,
              backgroundImage: 'linear-gradient(to bottom, #c9b78a 50%, transparent 50%)',
              backgroundSize: '2px 6px',
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl overflow-hidden flex gap-0"
        style={{
          background: state === 'nearby' ? '#fff8e6' : '#f9f1de',
          border: state === 'nearby' ? '1.5px solid #a14a3c' : '1px solid #c9b78a',
        }}
      >
        {/* Thumbnail with state */}
        <div className="flex-none" style={{ width: 72, height: 72 }}>
          <MissionIllustration mission={mission} state={state} />
        </div>

        {/* Body */}
        <div className="flex-1 px-3 py-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2" style={{ color: '#1c4f4c' }}>
              <MissionIcon categorie={mission.categorie} />
              <span
                className="font-mono uppercase text-ink-mute"
                style={{ fontSize: 9, letterSpacing: 1.2 }}
              >
                {mission.categorie || 'mission'}
              </span>
            </div>
            {state === 'nearby' && (
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, letterSpacing: 1.2, color: '#a14a3c' }}
              >
                ▸ À FAIRE
              </span>
            )}
          </div>
          <div
            className="font-title font-bold text-ink leading-tight mt-0.5 truncate"
            style={{ fontSize: 18 }}
          >
            {state === 'locked' ? '???' : mission.titre}
          </div>
        </div>
      </div>
    </div>
  )
}

function DownloadSheet({ onClose }) {
  const [stage, setStage] = useState('menu')
  const [progress, setProgress] = useState(0)
  const [picked, setPicked] = useState(null)

  const pick = kind => {
    setPicked(kind)
    if (kind === 'pdf') {
      setStage('done')
      return
    }
    setStage('progress')
    setProgress(0)
  }

  useEffect(() => {
    if (stage !== 'progress') return
    let p = 0
    const id = setInterval(() => {
      p = Math.min(100, p + Math.random() * 14 + 6)
      setProgress(p)
      if (p >= 100) { clearInterval(id); setTimeout(() => setStage('done'), 350) }
    }, 220)
    return () => clearInterval(id)
  }, [stage])

  return (
    <div
      className="absolute inset-0 z-50"
      style={{ background: 'rgba(15,13,9,0.55)', animation: 'fadeIn .2s both' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="absolute left-0 right-0 bottom-0 px-[18px] pt-2.5 pb-5"
        style={{
          background: '#f4ecd8',
          borderTop: '2px solid #2b2620',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: '0 -10px 30px rgba(15,13,9,0.35)',
          animation: 'sheetUp .28s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-1 mb-3.5" style={{ background: '#c9b78a' }} />

        {stage === 'menu' && (
          <>
            <div className="font-mono uppercase text-ink-mute mb-1" style={{ fontSize: 9, letterSpacing: 2 }}>
              Emporter avec soi
            </div>
            <h3 className="font-title font-bold text-ink m-0 mb-3.5 leading-tight" style={{ fontSize: 26 }}>
              Télécharger le sentier
            </h3>

            <button onClick={() => pick('map')} style={dlBtnStyle(false)}>
              <DLIcon kind="map" />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-title font-bold text-ink leading-none mb-1" style={{ fontSize: 20 }}>
                  Carte hors-ligne
                </div>
                <div className="font-body text-ink-soft leading-snug mb-1" style={{ fontSize: 13 }}>
                  Le tracé et les missions, accessibles sans réseau.
                </div>
                <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 9, letterSpacing: 1.3 }}>
                  ≈ 12 Mo · 30 jours
                </div>
              </div>
            </button>

            <div className="h-2.5" />

            <button onClick={() => pick('pdf')} style={dlBtnStyle(true)}>
              <DLIcon kind="pdf" />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-baseline gap-2 mb-1">
                  <div className="font-title font-bold text-ink leading-none" style={{ fontSize: 20 }}>
                    Cahier de l'explorateur
                  </div>
                  <span
                    className="font-mono uppercase border rounded-full px-1.5 py-0.5"
                    style={{ fontSize: 8, letterSpacing: 1.3, color: '#b8862e', borderColor: '#b8862e' }}
                  >
                    ★ Sortie famille
                  </span>
                </div>
                <div className="font-body text-ink-soft leading-snug mb-1" style={{ fontSize: 13 }}>
                  PDF imprimable A4 · sortie sans écran.
                </div>
                <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 9, letterSpacing: 1.3 }}>
                  10 pages · A4 recto-verso
                </div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3.5 py-2.5 bg-transparent border-none cursor-pointer font-body text-ink-mute"
              style={{ fontSize: 15 }}
            >
              Annuler
            </button>
          </>
        )}

        {stage === 'progress' && (
          <div className="py-2.5">
            <div className="font-mono uppercase text-ink-mute mb-1" style={{ fontSize: 9, letterSpacing: 2 }}>Téléchargement</div>
            <h3 className="font-title font-bold text-ink m-0 mb-3.5 leading-tight" style={{ fontSize: 24 }}>
              Préparation de la carte hors-ligne…
            </h3>
            <div
              className="h-2.5 rounded mb-2 overflow-hidden"
              style={{ background: '#ebe0c2', border: '1px solid #c9b78a' }}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(to right, #4a6b3a, #b8862e)',
                  borderRadius: 4,
                }}
              />
            </div>
            <div className="flex justify-between font-mono text-ink-soft" style={{ fontSize: 10, letterSpacing: 1.3 }}>
              <span>{Math.round((progress / 100) * 12 * 10) / 10} Mo / 12 Mo</span>
              <span>{Math.round(progress)} %</span>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="py-1.5 text-center">
            <div
              className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-3"
              style={{
                background: '#4a6b3a',
                color: '#f4ecd8',
                border: '1.5px solid #2b2620',
                boxShadow: '2px 2px 0 #2b2620',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 12 L10 17 L19 7" stroke="#f4ecd8" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="font-title font-bold text-ink m-0 mb-1.5 leading-tight" style={{ fontSize: 26 }}>
              {picked === 'pdf' ? 'Cahier bientôt disponible' : 'Carte téléchargée'}
            </h3>
            <p className="font-body text-ink-soft m-0 mb-3.5 leading-snug" style={{ fontSize: 15 }}>
              {picked === 'pdf'
                ? 'La génération du cahier PDF sera disponible dans une prochaine version.'
                : 'Tu peux partir explorer, même sans réseau.'}
            </p>
            <button
              onClick={onClose}
              className="w-full h-11 cursor-pointer font-title font-bold"
              style={{
                background: '#2b2620',
                color: '#f4ecd8',
                border: '2px solid #2b2620',
                borderRadius: 12,
                fontSize: 18,
                boxShadow: '2px 2px 0 #b8862e',
              }}
            >
              Continuer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function dlBtnStyle(highlighted) {
  return {
    width: '100%',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    background: highlighted ? '#fff8e6' : '#f9f1de',
    border: highlighted ? '1.5px solid #b8862e' : '1.5px solid #2b2620',
    borderRadius: 14,
    padding: '12px 14px',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 #2b2620',
  }
}

function DLIcon({ kind }) {
  const isPdf = kind === 'pdf'
  return (
    <div
      className="w-10 h-10 rounded-[10px] grid place-items-center flex-none"
      style={{
        background: isPdf ? '#b8862e' : '#1c4f4c',
        color: '#f4ecd8',
        border: '1.5px solid #2b2620',
      }}
    >
      {isPdf ? (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M5 2 H 12 L 16 6 V 18 H 5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 2 V 6 H 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 10 H 13 M 7.5 13 H 13 M 7.5 16 H 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M2 5 L 7 3 L 13 5 L 18 3 V 15 L 13 17 L 7 15 L 2 17 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7 3 V 15 M 13 5 V 17" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
        </svg>
      )}
    </div>
  )
}

export default function TrailDetailScreen({ sentier, collected = [], onStart, onBack }) {
  const { missions, loading } = useMissions(sentier?.id)
  const scrollRef = useRef(null)
  const [scrolled, setScrolled] = useState(0)
  const [favored, setFavored] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  if (!sentier) return null

  const completedCount = missions.filter(m => collected.includes(m.id)).length
  const diffStars = DIFF_TO_STARS[sentier.difficulte] || 2

  const heroHeight = Math.max(140, 320 - scrolled * 0.5)
  const heroFade = Math.max(0, 1 - scrolled / 200)

  const missionState = (m, idx) => {
    if (collected.includes(m.id)) return 'unlocked'
    const firstActiveIdx = missions.findIndex(x => !collected.includes(x.id))
    if (idx === firstActiveIdx) return 'nearby'
    return 'locked'
  }

  return (
    <div className="relative w-full h-full overflow-hidden parchment-bg font-body text-ink">

      {/* HERO */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden z-[1]"
        style={{ height: heroHeight, transition: 'height .15s linear' }}
      >
        <div className="absolute inset-0" style={{ transform: `scale(${1 + scrolled / 800})` }}>
          <TrailIllustration trail={sentier} />
        </div>
        <div
          className="absolute left-0 right-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #ebe0c2)' }}
        />
        <div
          className="absolute left-4 right-4 bottom-6"
          style={{ opacity: heroFade }}
        >
          <div
            className="font-mono uppercase mb-1"
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: '#f4ecd8',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {sentier.region || "Côte d'Azur"}
          </div>
          <h1
            className="m-0 font-title font-bold leading-none"
            style={{
              fontSize: 38,
              color: '#f4ecd8',
              textShadow: '0 2px 4px rgba(0,0,0,0.35), 0 0 20px rgba(0,0,0,0.2)',
            }}
          >
            {sentier.nom}
          </h1>
        </div>
      </div>

      {/* TOP BAR */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: scrolled > 100 ? 'rgba(244,236,216,0.92)' : 'transparent',
          backdropFilter: scrolled > 100 ? 'blur(8px)' : 'none',
          borderBottom: scrolled > 100 ? '1px solid rgba(43,38,32,0.1)' : 'none',
          transition: 'all .25s',
        }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-full grid place-items-center cursor-pointer"
          style={{ background: '#f9f1de', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620' }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2 L4 7 L9 12" stroke="#2b2620" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {scrolled > 140 && (
          <div className="absolute left-0 right-0 top-0 flex items-center justify-center pointer-events-none" style={{ height: 56 }}>
            <span className="font-title font-bold text-ink" style={{ fontSize: 20 }}>{sentier.nom}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setFavored(f => !f)}
            className="w-9 h-9 rounded-full grid place-items-center cursor-pointer"
            style={{ background: '#f9f1de', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M7 1.5 L8.5 5 L12 5.3 L9.4 7.7 L10.1 11.2 L7 9.5 L3.9 11.2 L4.6 7.7 L2 5.3 L5.5 5 Z"
                stroke="#2b2620" strokeWidth="1.2" fill={favored ? '#b8862e' : 'none'} />
            </svg>
          </button>
          <button
            onClick={() => setDownloadOpen(true)}
            className="w-9 h-9 rounded-full grid place-items-center cursor-pointer"
            style={{ background: '#f9f1de', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M7 2 L7 9 M4 6 L7 9 L10 6" stroke="#2b2620" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11 H 12" stroke="#2b2620" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{ paddingTop: 320, paddingBottom: 100 }}
      >
        {/* TEASER */}
        <div className="px-[18px] pt-1.5 pb-3.5 animate-fadeUp">
          <p
            className="m-0 font-title text-ink leading-snug"
            style={{ fontSize: 22, fontWeight: 500 }}
          >
            {sentier.description}
          </p>
        </div>

        {/* STATS */}
        <div className="px-[18px] pb-3.5 grid grid-cols-2 gap-2 animate-fadeUp">
          <StatTile
            label="Distance"
            value={`${sentier.distance_km} km`}
            icon={<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 10 L5 4 L7 8 L10 2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>}
          />
          <StatTile
            label="Durée"
            value={sentier.duree || '—'}
            icon={<svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M6 3 L6 6 L8 7" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>}
          />
          <StatTile
            label="Difficulté"
            value={sentier.difficulte || '—'}
            icon={<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 10 L6 2 L10 10 Z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>}
          />
          <StatTile
            label="Missions"
            value={`${missions.length}`}
            icon={<svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 1 L7.5 4.5 L11 5 L8.5 7.5 L9 11 L6 9 L3 11 L3.5 7.5 L1 5 L4.5 4.5 Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>}
          />
        </div>

        {/* MISSIONS */}
        <div className="px-[18px] pt-3.5 pb-3 animate-fadeUp">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="m-0 font-title font-bold text-ink" style={{ fontSize: 26 }}>
              Le carnet de l'Explorateur
            </h2>
            <span className="font-mono uppercase text-ink-mute" style={{ fontSize: 9, letterSpacing: 1.5 }}>
              {completedCount} / {missions.length}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden mb-3.5"
            style={{ background: '#ebe0c2', border: '1px solid #c9b78a' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: missions.length > 0 ? `${(completedCount / missions.length) * 100}%` : '0%',
                background: 'linear-gradient(to right, #4a6b3a, #7fc6c2)',
              }}
            />
          </div>
          {loading ? (
            <div className="text-center text-ink-mute py-6 font-title" style={{ fontSize: 18 }}>
              Chargement des missions…
            </div>
          ) : (
            <div>
              {missions.map((m, i) => (
                <MissionCheckpoint key={m.id} mission={m} idx={i} total={missions.length} state={missionState(m, i)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STICKY CTA */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[8] px-4 pt-3 pb-5"
        style={{ background: 'linear-gradient(to top, #ebe0c2 70%, rgba(235,224,194,0))' }}
      >
        <button
          onClick={() => onStart(sentier, missions)}
          className="w-full h-[54px] cursor-pointer font-title font-bold flex items-center justify-center gap-2.5"
          style={{
            background: '#2b2620',
            color: '#f4ecd8',
            border: '2px solid #2b2620',
            borderRadius: 14,
            fontSize: 22,
            boxShadow: '3px 3px 0 #b8862e',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M5 2 L14 9 L5 16 Z" fill="#b8862e" stroke="#b8862e" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {completedCount > 0 ? "Reprendre le sentier" : "Démarrer le sentier"}
        </button>
      </div>

      {downloadOpen && <DownloadSheet onClose={() => setDownloadOpen(false)} />}
    </div>
  )
}
