import React, { useState, useRef } from 'react'
import { MissionIllustration } from '../components/Illustration'
import NarrativePage from '../components/NarrativePage'
import { useMissionNarrative, useTrailNarrative } from '../hooks/useNarrative'
import { buildPostcard } from '../lib/postcard'

const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

const OBSERVATION_LABEL = {
  visuel: '👁 Observe',
  sensoriel: '✋ Ressens',
  comportemental: '🔭 Regarde',
  orientation: '🧭 Repère-toi',
}

export default function MissionScreen({ mission, trail: trailRow, team, onSouvenir, onComplete, onClose }) {
  const isFinale = !!mission?.mission_finale
  const hasObservation = !!(mission?.observation_question)
  const [phase, setPhase] = useState(hasObservation ? 'observe' : 'discover')
  const [hintsShown, setHintsShown] = useState(0)
  const [shake, setShake] = useState(false)
  const [observeShake, setObserveShake] = useState(false)
  const [observeWrong, setObserveWrong] = useState(false)
  const [observeSuccess, setObserveSuccess] = useState(false)
  const [postcardUrl, setPostcardUrl] = useState(null)
  const [building, setBuilding] = useState(false)
  const photoInputRef = useRef(null)
  const narrative = useMissionNarrative(mission?.id)
  const trail = useTrailNarrative(mission?.sentier_id)

  if (!mission) return null

  // ── Mission finale : capture de la photo souvenir ──
  function handleFinalePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBuilding(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const photoDataUrl = ev.target.result
      const family = team?.name
        ? `${team.name}${team.members?.length ? ' · ' + team.members.join(', ') : ''}`
        : (team?.members?.join(', ') || null)
      let postcard = photoDataUrl
      try {
        postcard = await buildPostcard({
          photoDataUrl,
          trailName: trailRow?.nom || '',
          naturalistName: trail?.naturalist_name || null,
          family,
          date: new Date().toISOString(),
        })
      } catch { /* en cas d'échec canvas, on garde la photo brute */ }
      setPostcardUrl(postcard)
      setBuilding(false)
      setPhase('finale-reveal')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function finishFinale() {
    if (postcardUrl) {
      onSouvenir?.({
        missionId: mission.id,
        trailId: mission.sentier_id,
        dataUrl: postcardUrl,
        date: new Date().toISOString(),
        family: team?.name || null,
      })
    }
    onComplete(mission.id)
  }

  async function sharePostcard() {
    try {
      const blob = await (await fetch(postcardUrl)).blob()
      const file = new File([blob], 'souvenir-terra-azur.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon souvenir Terra Azur' })
      } else {
        const a = document.createElement('a')
        a.href = postcardUrl; a.download = 'souvenir-terra-azur.png'; a.click()
      }
    } catch { /* annulé */ }
  }

  const choix = Array.isArray(mission.choix) ? mission.choix : JSON.parse(mission.choix || '[]')
  const observeChoix = Array.isArray(mission.observation_choix)
    ? mission.observation_choix
    : JSON.parse(mission.observation_choix || '[]')
  const emoji = mission.icone || CATEGORY_EMOJI[mission.categorie] || '🎯'

  function handleObserve(idx) {
    if (idx === mission.observation_bonne_reponse) {
      setObserveSuccess(true)
      setTimeout(() => {
        setObserveSuccess(false)
        setPhase('discover')
      }, 1400)
    } else {
      setObserveWrong(true)
      setObserveShake(true)
      setTimeout(() => setObserveShake(false), 600)
    }
  }

  function handleAnswer(idx) {
    if (idx === mission.bonne_reponse) {
      setPhase('correct')
    } else {
      setPhase('wrong')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
  }

  // ── FINALE : révélation de la carte postale souvenir ──
  if (phase === 'finale-reveal') {
    return (
      <div className="absolute inset-0 z-[60] flex items-center justify-center p-5 font-body overflow-y-auto"
        style={{ background: 'rgba(15,13,9,0.72)', animation: 'fadeIn .25s both' }}>
        <div className="w-full rounded-[18px] p-5 text-center"
          style={{ background: '#f4ecd8', border: '2px solid #2b2620', boxShadow: '4px 4px 0 #b8862e', animation: 'popIn .4s both' }}>
          <div className="font-mono uppercase text-ink-mute mb-2" style={{ fontSize: 9, letterSpacing: 2 }}>
            La page manquante du carnet
          </div>
          <div className="mx-auto mb-4 overflow-hidden rounded-2xl"
            style={{ maxWidth: 300, border: '2px solid #2b2620', boxShadow: '3px 3px 0 #b8862e', animation: 'missionReveal 1.4s ease-out both' }}>
            <img src={postcardUrl} alt="carte postale souvenir" style={{ width: '100%', display: 'block' }} />
          </div>
          <h2 className="m-0 mb-1.5 font-title font-bold text-ink leading-none" style={{ fontSize: 30 }}>
            Ton souvenir est gravé
          </h2>
          <p className="m-0 mb-4 font-body text-ink-soft leading-snug" style={{ fontSize: 15 }}>
            Cette photo rejoint la dernière page de ton carnet d'exploration.
          </p>
          <div className="flex gap-2.5">
            <button onClick={sharePostcard}
              className="flex-1 h-[50px] cursor-pointer font-title font-bold flex items-center justify-center gap-2"
              style={{ background: '#f9f1de', color: '#2b2620', border: '2px solid #2b2620', borderRadius: 14, fontSize: 17, boxShadow: '3px 3px 0 #b8862e' }}>
              ↗ Partager
            </button>
            <button onClick={finishFinale}
              className="flex-1 h-[50px] cursor-pointer font-title font-bold flex items-center justify-center gap-2"
              style={{ background: '#2b2620', color: '#f4ecd8', border: '2px solid #2b2620', borderRadius: 14, fontSize: 17, boxShadow: '3px 3px 0 #b8862e' }}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUCCESS overlay ──
  if (phase === 'correct') {
    return (
      <div
        className="absolute inset-0 z-[60] flex items-center justify-center p-5 font-body"
        style={{ background: 'rgba(15,13,9,0.6)', animation: 'fadeIn .25s both' }}
      >
        <div
          className="w-full rounded-[18px] p-5 text-center"
          style={{
            background: '#f4ecd8',
            border: '2px solid #2b2620',
            boxShadow: '4px 4px 0 #b8862e',
            animation: 'popIn .4s both',
          }}
        >
          {/* Illustration revealed — fade-in over 1.5s from silhouette to full colour */}
          <div
            className="mx-auto mb-3.5 overflow-hidden rounded-2xl"
            style={{
              width: 220,
              height: 280,
              border: '2px solid #2b2620',
              boxShadow: '3px 3px 0 #b8862e',
            }}
          >
            <MissionIllustration mission={mission} state="unlocked" />
          </div>
          {/* Check stamp */}
          <div
            className="-mt-12 mb-2 mx-auto w-12 h-12 rounded-full grid place-items-center"
            style={{
              background: '#4a6b3a',
              color: '#f4ecd8',
              border: '2px solid #2b2620',
              boxShadow: '2px 2px 0 #2b2620',
              transform: 'rotate(-8deg)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M5 12 L10 17 L19 7" stroke="#f4ecd8" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            className="font-mono uppercase text-ink-mute mb-1"
            style={{ fontSize: 9, letterSpacing: 2 }}
          >
            Mission réussie
          </div>
          <h2
            className="m-0 mb-1.5 font-title font-bold text-ink leading-none"
            style={{ fontSize: 32 }}
          >
            Bravo, explorateur !
          </h2>
          <p className="m-0 mb-4 font-body text-ink-soft leading-snug" style={{ fontSize: 15 }}>
            Tu as ajouté <strong>{mission.titre}</strong> à ton carnet.
          </p>
          <div
            className="flex items-center justify-center gap-2.5 mb-4 py-2.5 px-3.5 rounded-xl"
            style={{ background: '#fff8e6', border: '1.5px solid #b8862e' }}
          >
            <span style={{ fontSize: 24 }}>★</span>
            <div className="text-left">
              <div className="font-mono uppercase text-ink-mute" style={{ fontSize: 9, letterSpacing: 1.5 }}>
                Récompense
              </div>
              <div className="font-title font-bold leading-none" style={{ fontSize: 22, color: '#b8862e' }}>
                +50 azurs
              </div>
            </div>
          </div>
          <button
            onClick={() => onComplete(mission.id)}
            className="w-full h-[50px] cursor-pointer font-title font-bold flex items-center justify-center gap-2.5"
            style={{
              background: '#2b2620',
              color: '#f4ecd8',
              border: '2px solid #2b2620',
              borderRadius: 14,
              fontSize: 20,
              boxShadow: '3px 3px 0 #b8862e',
            }}
          >
            Continuer l'exploration
            <svg width="16" height="16" viewBox="0 0 14 14">
              <path d="M3 7 H 11 M 8 4 L 11 7 L 8 10" stroke="#f4ecd8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── OBSERVATION overlay (succès) ──
  if (phase === 'observe' && observeSuccess) {
    return (
      <div
        className="absolute inset-0 z-[60] flex items-center justify-center p-5 font-body"
        style={{ background: 'rgba(15,13,9,0.7)', animation: 'fadeIn .2s both' }}
      >
        <div
          className="w-full rounded-[18px] p-6 text-center"
          style={{
            background: '#f4ecd8',
            border: '2px solid #2b2620',
            boxShadow: '4px 4px 0 #4a6b3a',
            animation: 'popIn .35s both',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>👁</div>
          <div className="font-mono uppercase text-ink-mute mb-1" style={{ fontSize: 9, letterSpacing: 2 }}>
            Défi d'observation
          </div>
          <h2 className="m-0 mb-2 font-title font-bold text-ink leading-none" style={{ fontSize: 30 }}>
            Bien observé !
          </h2>
          <p className="m-0 font-body text-ink-soft leading-snug" style={{ fontSize: 14 }}>
            Tu peux maintenant lire la page du carnet…
          </p>
        </div>
      </div>
    )
  }

  // ── OBSERVATION phase ──
  if (phase === 'observe') {
    const obsLabel = OBSERVATION_LABEL[mission.observation_type] || '👁 Observe'
    return (
      <div className="relative w-full h-full overflow-hidden parchment-bg font-body text-ink">

        {/* HERO — locked silhouette */}
        <div className="absolute top-0 left-0 right-0 z-[1]" style={{ height: 200 }}>
          <MissionIllustration mission={mission} state="locked" />
          <div
            className="absolute left-0 right-0 bottom-0 h-[60px]"
            style={{ background: 'linear-gradient(to bottom, transparent, #ebe0c2)' }}
          />
        </div>

        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4" style={{ height: 56 }}>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full grid place-items-center cursor-pointer backdrop-blur-sm"
            style={{ background: 'rgba(244,236,216,0.92)', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M9 2 L4 7 L9 12" stroke="#2b2620" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            className="px-3.5 py-1.5 rounded-full backdrop-blur-sm font-mono uppercase text-ink"
            style={{ background: 'rgba(244,236,216,0.92)', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620', fontSize: 9, letterSpacing: 1.5 }}
          >
            {obsLabel}
          </div>
          <div className="w-9 h-9" />
        </div>

        {/* CONTENT */}
        <div
          className={`absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar ${observeShake ? 'animate-shake' : ''}`}
          style={{ paddingTop: 200, paddingBottom: 24 }}
        >
          {/* HEADER */}
          <div className="px-[18px] pt-2.5 pb-3.5 animate-fadeUp">
            <div className="flex items-center gap-2 mb-1.5 font-mono uppercase" style={{ fontSize: 9, letterSpacing: 1.8, color: '#1c4f4c' }}>
              <span>✦ Défi d'observation · {mission.categorie || ''}</span>
            </div>
            <h1 className="m-0 font-title font-bold text-ink leading-none" style={{ fontSize: 28 }}>
              {mission.titre}
            </h1>
          </div>

          {/* INTRO CARD */}
          <div className="px-[18px] pb-3.5 animate-fadeUp">
            <div
              className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
              style={{ background: 'linear-gradient(135deg, #1c1a14, #2b2620)', border: '1.5px solid #b8862e', boxShadow: '3px 3px 0 #b8862e' }}
            >
              <div style={{ fontSize: 28, marginTop: 2 }}>👁</div>
              <div>
                <div className="font-mono uppercase mb-1" style={{ fontSize: 8, letterSpacing: 1.5, color: '#b8862e' }}>
                  Avant de lire le carnet
                </div>
                <p className="m-0 font-body leading-snug" style={{ fontSize: 14, color: '#f4ecd8' }}>
                  Prends le temps d'observer ce qui t'entoure. Réponds à la question, puis la page du naturaliste se révélera.
                </p>
              </div>
            </div>
          </div>

          {/* QUESTION */}
          <div className="px-[18px] pb-3.5 animate-fadeUp">
            <div
              className="rounded-2xl px-4 py-3.5 relative"
              style={{ background: '#f9f1de', border: '1.5px solid #1c4f4c', boxShadow: '3px 3px 0 #1c4f4c' }}
            >
              <div
                className="absolute font-mono uppercase px-2"
                style={{ top: -10, left: 14, background: '#f9f1de', fontSize: 9, letterSpacing: 1.8, color: '#1c4f4c' }}
              >
                ✦ {obsLabel}
              </div>
              <p className="m-0 font-title text-ink leading-snug" style={{ fontSize: 20, fontWeight: 500 }}>
                {mission.observation_question}
              </p>
            </div>
          </div>

          {/* FEEDBACK MAUVAISE RÉPONSE */}
          {observeWrong && (
            <div className="px-[18px] pb-3 animate-fadeUp">
              <div className="rounded-xl px-3 py-2" style={{ background: '#fff8e6', border: '1px solid #b8862e' }}>
                <div className="font-mono uppercase text-ink-mute mb-0.5" style={{ fontSize: 8, letterSpacing: 1.5 }}>
                  🔍 Regarde encore…
                </div>
                <div className="font-body text-ink leading-snug" style={{ fontSize: 14 }}>
                  Prends le temps d'observer plus attentivement ton environnement.
                </div>
              </div>
            </div>
          )}

          {/* CHOICES */}
          <div className="px-[18px] pb-4 flex flex-col gap-2.5 animate-fadeUp">
            {observeChoix.map((c, i) => (
              <button
                key={i}
                onClick={() => handleObserve(i)}
                className="text-left cursor-pointer font-body flex items-center gap-3"
                style={{
                  background: '#f4ecd8',
                  color: '#2b2620',
                  border: '1.5px solid #2b2620',
                  borderRadius: 14,
                  padding: '12px 14px',
                  fontSize: 15,
                  boxShadow: '2px 2px 0 #2b2620',
                }}
              >
                <span
                  className="w-7 h-7 rounded-full grid place-items-center font-title font-bold flex-none"
                  style={{ background: '#1c4f4c', color: '#f4ecd8', border: '1.5px solid #2b2620', fontSize: 16 }}
                >
                  {['A', 'B', 'C'][i]}
                </span>
                <span className="flex-1">{c}</span>
              </button>
            ))}
          </div>

          {/* SECONDARY */}
          <div className="px-[18px] pb-4">
            <button
              onClick={onClose}
              className="w-full cursor-pointer font-body flex items-center justify-center gap-1.5"
              style={{ background: '#f9f1de', color: '#2b2620', border: '1.5px solid #2b2620', borderRadius: 10, padding: '10px 0', fontSize: 13, boxShadow: '1.5px 1.5px 0 #2b2620' }}
            >
              ↩︎ Plus tard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden parchment-bg font-body text-ink">

      {/* HERO ILLU — locked silhouette while in discovery/question, nearby pulse if wrong attempt */}
      <div className="absolute top-0 left-0 right-0 z-[1]" style={{ height: 200 }}>
        <MissionIllustration
          mission={mission}
          state={phase === 'wrong' ? 'nearby' : 'locked'}
        />
        <div
          className="absolute left-0 right-0 bottom-0 h-[60px]"
          style={{ background: 'linear-gradient(to bottom, transparent, #ebe0c2)' }}
        />
      </div>

      {/* TOP BAR */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
        style={{ height: 56 }}
      >
        <button
          onClick={onClose}
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
          className="px-3.5 py-1.5 rounded-full backdrop-blur-sm font-mono uppercase text-ink"
          style={{
            background: 'rgba(244,236,216,0.92)',
            border: '1.5px solid #2b2620',
            boxShadow: '1.5px 1.5px 0 #2b2620',
            fontSize: 9,
            letterSpacing: 1.5,
          }}
        >
          Mission · {mission.categorie || ''}
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* CONTENT */}
      <div
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar ${shake ? 'animate-shake' : ''}`}
        style={{ paddingTop: 200, paddingBottom: 24 }}
      >
        {/* HEADER */}
        <div className="px-[18px] pt-2.5 pb-3.5 animate-fadeUp">
          <div
            className="flex items-center gap-2 mb-1.5 font-mono uppercase"
            style={{ fontSize: 9, letterSpacing: 1.8, color: '#a14a3c' }}
          >
            <span>★ {mission.categorie || 'MISSION'}</span>
          </div>
          <h1
            className="m-0 font-title font-bold text-ink leading-none"
            style={{ fontSize: 32 }}
          >
            {mission.titre}
          </h1>
        </div>

        {/* PAGE DU CARNET — version manuscrite (Caveat) si trame narrative dispo */}
        {phase !== 'question' && phase !== 'wrong' && (
          <div className="px-[18px] pb-3.5 animate-fadeUp">
            {narrative ? (
              <NarrativePage
                pageNumber={narrative.page_number}
                naturalist={trail?.naturalist_name ? `${trail.naturalist_name}, ${trail.naturalist_period || ''}`.trim().replace(/,\s*$/, '') : null}
                text={narrative.journal_text}
                audioUrl={narrative.audio_url}
              />
            ) : (
              <div
                className="rounded-2xl px-4 py-3.5 relative"
                style={{
                  background: '#fff8e6',
                  border: '1.5px solid #b8862e',
                  boxShadow: '3px 3px 0 #b8862e',
                }}
              >
                <div
                  className="absolute font-label uppercase px-2"
                  style={{
                    top: -10,
                    left: 14,
                    background: '#fff8e6',
                    fontSize: 9,
                    letterSpacing: 1.8,
                    color: '#b8862e',
                  }}
                >
                  ✦ Le carnet
                </div>
                <p className="m-0 font-body text-ink leading-snug" style={{ fontSize: 15 }}>
                  {mission.texte}
                </p>
              </div>
            )}
          </div>
        )}

        {/* QUESTION CARD */}
        {!isFinale && (phase === 'question' || phase === 'wrong' || phase === 'discover') && (
          <div className="px-[18px] pb-3.5 animate-fadeUp">
            <div
              className="rounded-2xl px-4 py-3.5 relative"
              style={{
                background: '#f9f1de',
                border: '1.5px solid #2b2620',
                boxShadow: '3px 3px 0 #2b2620',
              }}
            >
              <div
                className="absolute font-mono uppercase px-2"
                style={{
                  top: -10,
                  left: 14,
                  background: '#f9f1de',
                  fontSize: 9,
                  letterSpacing: 1.8,
                  color: '#a14a3c',
                }}
              >
                ✦ La question
              </div>
              <p
                className="m-0 font-title text-ink leading-snug"
                style={{ fontSize: 20, fontWeight: 500 }}
              >
                {mission.question}
              </p>
            </div>
          </div>
        )}

        {/* HINT (after wrong answer) */}
        {phase === 'wrong' && mission.indice && (
          <div className="px-[18px] pb-3.5 animate-fadeUp">
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: '#f9f1de', border: '1px solid #c9b78a' }}
            >
              <div className="font-mono uppercase text-ink-mute mb-0.5" style={{ fontSize: 8, letterSpacing: 1.5 }}>
                💡 Indice
              </div>
              <div className="font-body text-ink leading-snug" style={{ fontSize: 14 }}>
                {mission.indice}
              </div>
            </div>
          </div>
        )}

        {/* FINALE : capture de la photo souvenir */}
        {isFinale && (
          <div className="px-[18px] pb-4 animate-fadeUp">
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={handleFinalePhoto} />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={building}
              className="w-full cursor-pointer font-title font-bold flex items-center justify-center gap-2.5"
              style={{
                background: '#a14a3c', color: '#f4ecd8', border: '2px solid #2b2620',
                borderRadius: 14, padding: '15px 0', fontSize: 20, boxShadow: '3px 3px 0 #b8862e',
                opacity: building ? 0.7 : 1,
              }}>
              📷 {building ? 'Préparation…' : 'Prendre ma photo souvenir'}
            </button>
            <p className="m-0 mt-2.5 text-center font-body text-ink-soft leading-snug" style={{ fontSize: 13 }}>
              Capture la vue depuis ce point. Elle deviendra ta carte postale et la dernière page du carnet.
            </p>
          </div>
        )}

        {/* ANSWER BUTTONS */}
        {!isFinale && (
        <div className="px-[18px] pb-4 flex flex-col gap-2.5 animate-fadeUp">
          {choix.map((c, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="text-left cursor-pointer font-body flex items-center gap-3"
              style={{
                background: '#f4ecd8',
                color: '#2b2620',
                border: '1.5px solid #2b2620',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 15,
                boxShadow: '2px 2px 0 #2b2620',
              }}
            >
              <span
                className="w-7 h-7 rounded-full grid place-items-center font-title font-bold flex-none"
                style={{
                  background: '#a14a3c',
                  color: '#f4ecd8',
                  border: '1.5px solid #2b2620',
                  fontSize: 16,
                }}
              >
                {['A', 'B', 'C'][i]}
              </span>
              <span className="flex-1">{c}</span>
            </button>
          ))}
        </div>
        )}

        {/* SECONDARY ACTIONS */}
        <div className="px-[18px] pb-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer font-body flex items-center justify-center gap-1.5"
            style={{
              background: '#f9f1de',
              color: '#2b2620',
              border: '1.5px solid #2b2620',
              borderRadius: 10,
              padding: '10px 0',
              fontSize: 13,
              boxShadow: '1.5px 1.5px 0 #2b2620',
            }}
          >
            ↩︎ Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
