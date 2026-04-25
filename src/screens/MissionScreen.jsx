import React, { useState } from 'react'

const CATEGORY_COLOR = {
  Plante:        { bg: '#3A5A2A', light: '#E8F5E0' },
  Animal:        { bg: '#7B4A1A', light: '#F5EDE0' },
  'Géologie':    { bg: '#8B2500', light: '#F5E0DC' },
  'Point de vue':{ bg: '#1A3A7B', light: '#E0E8F5' },
}
const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

export default function MissionScreen({ mission, onComplete, onClose }) {
  const [phase, setPhase] = useState('discover')  // 'discover' | 'question' | 'success' | 'wrong'
  const [chosen, setChosen] = useState(null)

  if (!mission) return null

  const colors = CATEGORY_COLOR[mission.categorie] || { bg: '#5C3D1E', light: '#F5EBD8' }
  const choix = Array.isArray(mission.choix) ? mission.choix : JSON.parse(mission.choix || '[]')

  function handleAnswer(idx) {
    setChosen(idx)
    if (idx === mission.bonne_reponse) {
      setPhase('success')
      setTimeout(() => onComplete(mission.id), 2800)
    } else {
      setPhase('wrong')
    }
  }

  // ── Phase DÉCOUVERTE ─────────────────────────────────────────────
  if (phase === 'discover') return (
    <div className="h-full overflow-y-auto font-body" style={{ background: colors.light }}>

      {/* Header coloré */}
      <div className="relative flex flex-col items-center justify-center pt-12 pb-8 px-6"
           style={{ background: colors.bg }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl leading-none">✕</button>

        {/* Carte à collectionner */}
        <div className="w-44 h-56 rounded-2xl border-4 border-white/60 shadow-2xl flex flex-col overflow-hidden mb-4 card-reveal"
             style={{ background: colors.light }}>
          <div className="text-white text-xs font-bold text-center py-1.5" style={{ background: colors.bg }}>
            {mission.categorie}
          </div>
          <div className="flex-1 flex items-center justify-center text-8xl">
            {CATEGORY_EMOJI[mission.categorie] || '🎯'}
          </div>
          <div className="py-2 px-2 text-center" style={{ background: colors.bg }}>
            <p className="text-white font-adventure text-sm leading-tight">{mission.titre}</p>
          </div>
        </div>

        <span className="text-white/70 text-xs font-bold tracking-widest uppercase">
          {mission.categorie}
        </span>
        <h1 className="font-adventure text-white text-2xl text-center mt-1">{mission.titre}</h1>
      </div>

      {/* Texte de découverte */}
      <div className="px-5 py-6">
        <div className="bg-white/70 rounded-2xl p-4 mb-6 border border-white shadow-sm">
          <p className="text-adventure-brown leading-relaxed text-sm">{mission.texte}</p>
        </div>

        <button
          onClick={() => setPhase('question')}
          className="w-full font-adventure text-xl py-4 rounded-2xl shadow-lg active:scale-95 transition-transform text-white"
          style={{ background: colors.bg }}
        >
          🧠 Répondre à la question !
        </button>
      </div>
    </div>
  )

  // ── Phase QUESTION ───────────────────────────────────────────────
  if (phase === 'question') return (
    <div className="h-full overflow-y-auto font-body" style={{ background: colors.light }}>

      <div className="px-5 pt-10 pb-6 flex flex-col min-h-full">
        {/* Question */}
        <div className="mb-8">
          <span className="text-4xl block text-center mb-4">🧠</span>
          <h2 className="font-adventure text-adventure-brown text-2xl text-center leading-snug mb-2">
            Question !
          </h2>
          <p className="text-adventure-brown text-center text-base leading-relaxed font-bold">
            {mission.question}
          </p>
        </div>

        {/* Choix */}
        <div className="flex flex-col gap-3 flex-1">
          {choix.map((c, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="w-full py-4 px-5 rounded-2xl text-left font-bold text-base shadow-md active:scale-95 transition-transform border-2"
              style={{
                background: 'white',
                borderColor: colors.bg,
                color: colors.bg,
              }}
            >
              <span className="mr-3 font-adventure text-xl">
                {['A', 'B', 'C'][i]}
              </span>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Phase SUCCÈS ─────────────────────────────────────────────────
  if (phase === 'success') return (
    <div className="h-full flex flex-col items-center justify-center font-body px-6 gap-6"
         style={{ background: colors.bg }}>

      {/* Carte animée */}
      <div className="w-52 h-64 rounded-2xl border-4 border-adventure-gold shadow-2xl flex flex-col overflow-hidden card-reveal">
        <div className="text-white text-xs font-bold text-center py-1.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {mission.categorie}
        </div>
        <div className="flex-1 flex items-center justify-center text-9xl bg-white/10">
          {CATEGORY_EMOJI[mission.categorie] || '🎯'}
        </div>
        <div className="py-2 px-2 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p className="text-white font-adventure text-base leading-tight">{mission.titre}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="font-adventure text-white text-3xl mb-2">Bravo ! 🎉</p>
        <p className="text-white/80 text-sm">Nouvelle carte ajoutée à ta collection !</p>
      </div>

      <div className="text-6xl animate-bounce">⭐</div>
    </div>
  )

  // ── Phase MAUVAISE RÉPONSE ───────────────────────────────────────
  if (phase === 'wrong') return (
    <div className="h-full flex flex-col items-center justify-center font-body px-6 gap-6"
         style={{ background: colors.light }}>

      <span className="text-7xl">🤔</span>

      <div className="text-center">
        <h2 className="font-adventure text-adventure-brown text-2xl mb-3">Pas tout à fait…</h2>
        <div className="bg-white/80 rounded-2xl p-4 border-2 mb-6"
             style={{ borderColor: colors.bg }}>
          <p className="text-xs font-bold mb-1" style={{ color: colors.bg }}>💡 Indice :</p>
          <p className="text-adventure-brown text-sm leading-relaxed">{mission.indice}</p>
        </div>
      </div>

      <button
        onClick={() => { setPhase('question'); setChosen(null) }}
        className="w-full font-adventure text-xl py-4 rounded-2xl shadow-lg active:scale-95 transition-transform text-white"
        style={{ background: colors.bg }}
      >
        🔄 Réessayer !
      </button>
    </div>
  )

  return null
}
