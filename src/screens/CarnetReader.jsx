import React, { useRef, useState, useEffect } from 'react'
import { MissionIllustration } from '../components/Illustration'
import NarrativePage from '../components/NarrativePage'

const S = {
  title: { fontFamily: "'Bebas Neue', sans-serif" },
  label: {
    fontFamily: 'Lora, serif', textTransform: 'uppercase',
    letterSpacing: 1.6, fontSize: 10, color: '#8a7e6c',
  },
}

// Portrait du naturaliste — respecte la règle d'asset : si le fichier manque,
// placeholder neutre « asset à fournir » (pas de substitution).
function NaturalistPortrait({ trailId, name }) {
  const [errored, setErrored] = useState(false)
  const src = trailId ? `/illustrations/naturalists/${trailId}.png` : null
  useEffect(() => { setErrored(false) }, [trailId])

  if (!src || errored) {
    return (
      <div
        className="grid place-items-center mx-auto"
        style={{
          width: 150, height: 190, borderRadius: 8,
          background: 'repeating-linear-gradient(45deg, #e6d7b0 0 14px, #ddca9c 14px 28px)',
          border: '3px solid #8a6d3a',
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        }}
      >
        <div className="text-center px-2" style={{ ...S.label, fontSize: 9, lineHeight: 1.4 }}>
          ✦ Portrait ✦<br /><span style={{ opacity: 0.7 }}>asset à fournir</span>
        </div>
      </div>
    )
  }
  return (
    <img
      src={src} alt={name || 'naturaliste'} onError={() => setErrored(true)}
      style={{
        width: 150, height: 190, objectFit: 'cover', borderRadius: 8,
        border: '3px solid #8a6d3a', boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        filter: 'sepia(0.45) contrast(1.02)', display: 'block', margin: '0 auto',
      }}
    />
  )
}

// Tampon « Page à retrouver » pour les pages verrouillées
function StampToFind() {
  return (
    <div
      className="absolute"
      style={{
        top: '42%', left: '50%', transform: 'translate(-50%,-50%) rotate(-11deg)',
        border: '3px double #a14a3c', color: '#a14a3c',
        padding: '8px 16px', borderRadius: 6, opacity: 0.85,
        ...S.title, fontSize: 22, letterSpacing: 2,
        background: 'rgba(244,236,216,0.55)',
      }}
    >
      Page à retrouver
    </div>
  )
}

function PageShell({ children }) {
  return (
    <div
      className="flex-none snap-center h-full overflow-y-auto"
      style={{ width: '100%', scrollSnapAlign: 'center' }}
    >
      <div className="min-h-full px-6 py-7 flex flex-col">{children}</div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return null }
}

export default function CarnetReader({ carnet, team, souvenir, souvenirByMission = {}, onClose }) {
  const scrollRef = useRef(null)
  const [page, setPage] = useState(0)

  const { trail, naturalist, pages } = carnet
  const totalPages = 1 + pages.length + 1 // garde + missions + clôture

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== page) setPage(idx)
  }

  function goTo(idx) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  const familyLine = team?.name
    ? `${team.name}${team.members?.length ? ' · ' + team.members.join(', ') : ''}`
    : null

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#14110c' }}>
      {/* Barre haute */}
      <div className="flex items-center justify-between px-4 py-3 flex-none"
        style={{ borderBottom: '1px solid rgba(244,236,216,0.08)' }}>
        <button onClick={onClose}
          className="flex items-center gap-2 cursor-pointer"
          style={{ background: 'none', border: 'none', color: '#c9b78a' }}>
          <svg width="13" height="13" viewBox="0 0 14 14"><path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ ...S.label, color: '#c9b78a' }}>Les carnets</span>
        </button>
        <span style={{ ...S.label }}>{page === 0 ? 'Page de garde' : page <= pages.length ? `Page ${page}` : 'Clôture'}</span>
      </div>

      {/* Livre — scroll horizontal à snap */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {/* ── Page de garde ── */}
        <PageShell>
          <div style={{ ...S.label, textAlign: 'center' }}>{trail.region || 'Côte d’Azur'}</div>
          <h1 style={{ ...S.title, fontSize: 30, color: '#f4ecd8', textAlign: 'center', lineHeight: 0.98, margin: '4px 0 18px' }}>
            {trail.nom}
          </h1>
          <NaturalistPortrait trailId={trail.id} name={naturalist?.name} />
          {naturalist && (
            <div className="text-center mt-3">
              <div style={{ ...S.title, fontSize: 22, color: '#f4ecd8' }}>{naturalist.name}</div>
              <div style={{ ...S.label, color: '#b8862e' }}>{naturalist.period}</div>
            </div>
          )}
          {(naturalist?.intro || trail.description) && (
            <p className="font-journal mt-4" style={{ color: '#e8dcbf', fontSize: 19, lineHeight: 1.4, textAlign: 'center' }}>
              {naturalist?.intro || trail.description}
            </p>
          )}

          {/* Export PDF — préparé, désactivé (premium futur) */}
          <div className="mt-auto pt-6">
            <button
              disabled
              className="w-full flex items-center justify-center gap-2"
              style={{
                opacity: 0.5, cursor: 'not-allowed',
                background: 'rgba(244,236,216,0.06)', color: '#c9b78a',
                border: '1px dashed rgba(201,183,138,0.5)', borderRadius: 12,
                padding: '12px 16px', ...S.label, letterSpacing: 1.4, fontSize: 11,
              }}
            >
              🖨 Imprimer ce carnet · Bientôt disponible
            </button>
          </div>
        </PageShell>

        {/* ── Pages des missions ── */}
        {pages.map((p) => {
          const isFinale = !!p.mission.mission_finale
          const sv = souvenirByMission[p.mission.id]
          return (
          <PageShell key={p.mission.id}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ ...S.label }}>{p.mission.categorie}</span>
              <span style={{ fontSize: 20 }}>{p.mission.icone || ''}</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden mb-4"
              style={{ aspectRatio: '4/3', border: '2px solid #8a6d3a' }}>
              {isFinale ? (
                sv ? (
                  <img src={sv.dataUrl} alt={p.mission.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-center px-6"
                    style={{ background: 'repeating-linear-gradient(45deg, #2a2820 0 14px, #24221b 14px 28px)' }}>
                    <div>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                      <p style={{ ...S.label, lineHeight: 1.5 }}>Page à révéler<br />par ta photo souvenir</p>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <MissionIllustration mission={p.mission} state={p.unlocked ? 'unlocked' : 'locked'} />
                  {!p.unlocked && <StampToFind />}
                </>
              )}
            </div>

            {p.unlocked ? (
              <>
                <h2 style={{ ...S.title, fontSize: 24, color: '#f4ecd8', marginBottom: 10 }}>{p.mission.titre}</h2>
                <NarrativePage
                  pageNumber={p.narrative?.page_number ?? '—'}
                  naturalist={naturalist ? `${naturalist.name}, ${naturalist.period}` : null}
                  text={p.narrative?.journal_text || p.mission.texte || 'Le carnet est silencieux sur cette page…'}
                  audioUrl={p.narrative?.audio_url || null}
                />
              </>
            ) : (
              <p className="font-journal text-center" style={{ color: '#8a7e6c', fontSize: 19 }}>
                {isFinale
                  ? 'Atteins le point de vue et prends ta photo pour révéler cette page.'
                  : 'Cette page se révélera lorsque tu auras atteint ce point de l’exploration.'}
              </p>
            )}
          </PageShell>
          )
        })}

        {/* ── Page finale / clôture ── */}
        <PageShell>
          <div style={{ ...S.label, textAlign: 'center' }}>Souvenir d’exploration</div>
          <h2 style={{ ...S.title, fontSize: 26, color: '#f4ecd8', textAlign: 'center', margin: '4px 0 16px' }}>
            La dernière page
          </h2>

          <div className="relative rounded-2xl overflow-hidden mb-4"
            style={{ aspectRatio: '4/3', border: '2px solid #8a6d3a', background: 'rgba(244,236,216,0.04)' }}>
            {souvenir?.dataUrl ? (
              <img src={souvenir.dataUrl} alt="souvenir" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-6">
                <div>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                  <p style={{ ...S.label, lineHeight: 1.5 }}>
                    Ta photo souvenir prise au point de vue<br />apparaîtra ici en fin de sentier
                  </p>
                </div>
              </div>
            )}
          </div>

          {naturalist?.ending && (
            <p className="font-journal" style={{ color: '#e8dcbf', fontSize: 19, lineHeight: 1.4, textAlign: 'center' }}>
              {naturalist.ending}
            </p>
          )}

          <div className="mt-auto pt-6 text-center">
            {familyLine && (
              <div style={{ ...S.title, fontSize: 18, color: '#c9b78a' }}>{familyLine}</div>
            )}
            {formatDate(souvenir?.date || carnet.lastUpdate) && (
              <div style={{ ...S.label, marginTop: 4 }}>{formatDate(souvenir?.date || carnet.lastUpdate)}</div>
            )}
          </div>
        </PageShell>
      </div>

      {/* Indicateurs de page (points) */}
      <div className="flex items-center justify-center gap-1.5 py-3 flex-none"
        style={{ borderTop: '1px solid rgba(244,236,216,0.08)' }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Page ${i + 1}`}
            className="cursor-pointer" style={{
              width: i === page ? 18 : 6, height: 6, borderRadius: 3, border: 'none',
              background: i === page ? '#b8862e' : 'rgba(244,236,216,0.25)',
              transition: 'width 0.2s, background 0.2s',
            }} />
        ))}
      </div>
    </div>
  )
}
