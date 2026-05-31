import React, { useState, useMemo } from 'react'
import { useCarnets } from '../hooks/useCarnets'
import { TrailIllustration, MissionIllustration } from '../components/Illustration'
import CarnetReader from './CarnetReader'

const S = {
  title: { fontFamily: "'Bebas Neue', sans-serif" },
  label: {
    fontFamily: 'Lora, serif', textTransform: 'uppercase',
    letterSpacing: 1.6, fontSize: 10, color: '#8a7e6c',
  },
}

const STATUS = {
  complete:     { label: 'Complet',      color: '#4a6b3a', bg: 'rgba(74,107,58,0.16)' },
  'en-cours':   { label: 'En cours',     color: '#b8862e', bg: 'rgba(184,134,46,0.16)' },
  'a-decouvrir':{ label: 'À découvrir',  color: '#8a7e6c', bg: 'rgba(138,126,108,0.14)' },
}

const SUBTABS = [
  { id: 'carnets',   label: 'Carnets' },
  { id: 'cartes',    label: 'Cartes' },
  { id: 'insignes',  label: 'Insignes' },
  { id: 'souvenirs', label: 'Souvenirs' },
]

function formatDate(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return null }
}

// ── Insignes calculés sur la progression actuelle ──────────────────────────────
function computeBadges(carnets) {
  const allPages = carnets.flatMap(c => c.pages)
  const unlocked = allPages.filter(p => p.unlocked)
  const byCat = (cat) => unlocked.some(p => (p.mission.categorie || '').toLowerCase() === cat)
  const completeCount = carnets.filter(c => c.status === 'complete').length
  const startedCount = carnets.filter(c => c.status !== 'a-decouvrir').length

  return [
    { id: 'first',   icon: '🥾', label: 'Premiers pas',      desc: 'Première découverte débloquée',          earned: unlocked.length >= 1 },
    { id: 'opened',  icon: '📖', label: 'Carnet ouvert',     desc: 'Un sentier commencé',                    earned: startedCount >= 1 },
    { id: 'trail',   icon: '🏅', label: 'Sentier accompli',  desc: 'Un carnet complété',                     earned: completeCount >= 1 },
    { id: 'all',     icon: '🌟', label: 'Grand explorateur', desc: 'Tous les carnets complétés',             earned: carnets.length > 0 && completeCount === carnets.length },
    { id: 'botanist',icon: '🌿', label: 'Botaniste',         desc: 'Une découverte « Plante »',              earned: byCat('plante') },
    { id: 'animal',  icon: '🦅', label: 'Animalier',         desc: 'Une découverte « Animal »',              earned: byCat('animal') },
    { id: 'geo',     icon: '🪨', label: 'Géologue',          desc: 'Une découverte « Géologie »',            earned: byCat('géologie') },
    { id: 'summit',  icon: '🏔', label: 'Veilleur des cimes',desc: 'Une découverte « Point de vue »',        earned: byCat('point de vue') },
  ]
}

// ── Carte d'un carnet (accueil) ─────────────────────────────────────────────────
function CarnetCard({ carnet, onOpen }) {
  const st = STATUS[carnet.status]
  const dimmed = carnet.status === 'a-decouvrir'
  const date = formatDate(carnet.lastUpdate)

  return (
    <button onClick={() => onOpen(carnet)}
      className="w-full text-left cursor-pointer flex gap-3 items-stretch"
      style={{
        background: 'rgba(244,236,216,0.05)', border: '1px solid rgba(244,236,216,0.1)',
        borderRadius: 16, padding: 12, opacity: dimmed ? 0.55 : 1,
      }}>
      <div className="flex-none rounded-xl overflow-hidden" style={{ width: 74, height: 92, border: '1px solid rgba(244,236,216,0.12)' }}>
        <TrailIllustration trail={carnet.trail} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span style={{ ...S.label, color: '#b8862e' }}>{carnet.naturalist?.name || '—'}{carnet.naturalist?.period ? ` · ${carnet.naturalist.period}` : ''}</span>
        <span style={{ ...S.title, fontSize: 21, color: '#f4ecd8', lineHeight: 1.05, marginTop: 2 }}>{carnet.trail.nom}</span>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span style={{ ...S.label, color: st.color, background: st.bg, padding: '3px 9px', borderRadius: 20, fontSize: 9 }}>
            {st.label}
          </span>
          <span style={{ ...S.label, fontSize: 9 }}>{carnet.completedCount}/{carnet.total}</span>
          {date && !dimmed && <span style={{ ...S.label, fontSize: 9, marginLeft: 'auto' }}>maj {date}</span>}
        </div>
      </div>
    </button>
  )
}

export default function CarnetScreen({ collected = [], collectedAt = {}, team }) {
  const { carnets, loading } = useCarnets(collected, collectedAt)
  const [sub, setSub] = useState('carnets')
  const [openCarnet, setOpenCarnet] = useState(null)

  const badges = useMemo(() => computeBadges(carnets), [carnets])
  const unlockedPages = useMemo(() => carnets.flatMap(c => c.pages).filter(p => p.unlocked), [carnets])
  const souvenirs = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('terra.souvenirs') || '[]') } catch { return [] }
  }, [])

  if (openCarnet) {
    return <CarnetReader carnet={openCarnet} team={team} souvenir={null} onClose={() => setOpenCarnet(null)} />
  }

  return (
    <div className="h-full overflow-y-auto font-body pb-24" style={{ background: '#14110c' }}>
      {/* En-tête */}
      <div className="px-5 pt-12 pb-3">
        <h1 style={{ ...S.title, fontSize: 32, color: '#f4ecd8' }}>Le Carnet</h1>
        <p style={{ ...S.label, marginTop: 2 }}>Les carnets de tes explorations</p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto">
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className="cursor-pointer flex-none"
            style={{
              ...S.label, fontSize: 11, letterSpacing: 1.2, padding: '7px 14px', borderRadius: 20,
              color: sub === t.id ? '#1c1a14' : '#c9b78a',
              background: sub === t.id ? '#b8862e' : 'rgba(244,236,216,0.06)',
              border: sub === t.id ? 'none' : '1px solid rgba(244,236,216,0.12)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading ? (
          <p style={{ ...S.label }}>Chargement…</p>
        ) : sub === 'carnets' ? (
          <div className="flex flex-col gap-3">
            {carnets.map(c => <CarnetCard key={c.trail.id} carnet={c} onOpen={setOpenCarnet} />)}
          </div>
        ) : sub === 'cartes' ? (
          unlockedPages.length === 0 ? (
            <EmptyState icon="🃏" text="Tes cartes d’exploration apparaîtront ici à mesure que tu débloques des découvertes." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {unlockedPages.map(p => (
                <div key={p.mission.id} className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(244,236,216,0.14)' }}>
                  <div style={{ aspectRatio: '3/4' }}>
                    <MissionIllustration mission={p.mission} state="unlocked" />
                  </div>
                  <div style={{ background: 'rgba(20,17,12,0.92)', padding: '7px 9px' }}>
                    <div style={{ ...S.label, color: '#b8862e', fontSize: 8 }}>{p.mission.categorie}</div>
                    <div style={{ ...S.title, fontSize: 15, color: '#f4ecd8', lineHeight: 1.05 }}>{p.mission.titre}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : sub === 'insignes' ? (
          <div className="grid grid-cols-2 gap-3">
            {badges.map(b => (
              <div key={b.id} className="rounded-2xl p-3 flex gap-2.5 items-start"
                style={{
                  background: b.earned ? 'rgba(184,134,46,0.1)' : 'rgba(244,236,216,0.04)',
                  border: `1px solid ${b.earned ? 'rgba(184,134,46,0.4)' : 'rgba(244,236,216,0.1)'}`,
                  opacity: b.earned ? 1 : 0.6,
                }}>
                <span style={{ fontSize: 26, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
                <div>
                  <div style={{ ...S.title, fontSize: 16, color: b.earned ? '#f4ecd8' : '#8a7e6c' }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: '#8a7e6c', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          souvenirs.length === 0 ? (
            <EmptyState icon="📷" text="Tes souvenirs photo apparaîtront ici après tes randonnées, triés par date." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {souvenirs.map((s, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(244,236,216,0.14)' }}>
                  <img src={s.dataUrl} alt="souvenir" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                  <div style={{ background: 'rgba(20,17,12,0.92)', padding: '6px 9px', ...S.label, fontSize: 9 }}>
                    {formatDate(s.date) || ''}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-16 px-6">
      <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.7 }}>{icon}</div>
      <p style={{ ...S.label, lineHeight: 1.6, fontSize: 11 }}>{text}</p>
    </div>
  )
}
