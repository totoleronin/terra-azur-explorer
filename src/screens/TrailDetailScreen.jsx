import React from 'react'
import { useMissions } from '../hooks/useTrails'

const DIFF_COLOR = { Facile: 'bg-green-600', Moyen: 'bg-yellow-500', Difficile: 'bg-red-600' }
const CATEGORY_EMOJI = { Plante: '🌿', Animal: '🦌', 'Géologie': '🪨', 'Point de vue': '🏔️' }

export default function TrailDetailScreen({ sentier, collected = [], onStart, onBack }) {
  const { missions, loading } = useMissions(sentier?.id)

  if (!sentier) return null

  const completedCount = missions.filter(m => collected.includes(m.id)).length

  return (
    <div className="h-full overflow-y-auto parchment-bg font-body pb-24">

      {/* Hero illustration — roches rouges rhyolite + tour de relais */}
      <div className="relative h-56 flex items-center justify-center overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #7B2D00 0%, #B84A1A 40%, #D4753A 70%, #8B4513 100%)' }}>

        {/* Roches stylisées en arrière-plan */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 opacity-40 select-none">
          <span className="text-7xl" style={{ marginBottom: '-8px' }}>🪨</span>
          <span className="text-5xl" style={{ marginBottom: '-4px' }}>🪨</span>
          <span className="text-6xl" style={{ marginBottom: '-6px' }}>🪨</span>
          <span className="text-4xl" style={{ marginBottom: '-4px' }}>🪨</span>
          <span className="text-7xl" style={{ marginBottom: '-8px' }}>🪨</span>
        </div>

        {/* Tour de relais au centre */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className="text-8xl drop-shadow-lg">🗼</span>
          <span className="text-white/80 text-xs font-bold tracking-widest font-body">618 m</span>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl backdrop-blur-sm z-20"
        >
          ←
        </button>

        {/* Gradient bas */}
        <div className="absolute bottom-0 left-0 right-0 h-10"
             style={{ background: 'linear-gradient(transparent, #F5E6C8)' }} />
      </div>

      <div className="px-4 pt-3">
        {/* Title */}
        <h1 className="font-adventure text-adventure-brown text-2xl leading-snug mb-3">
          {sentier.nom}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${DIFF_COLOR[sentier.difficulte] || 'bg-gray-500'}`}>
            {sentier.difficulte}
          </span>
          <span className="text-adventure-brown text-xs font-bold bg-parchment-300 px-3 py-1 rounded-full border border-adventure-gold/30">
            ⏱ {sentier.duree}
          </span>
          <span className="text-adventure-brown text-xs font-bold bg-parchment-300 px-3 py-1 rounded-full border border-adventure-gold/30">
            📏 {sentier.distance_km} km
          </span>
        </div>

        {/* Description */}
        <p className="text-adventure-brown/80 text-sm leading-relaxed mb-5">
          {sentier.description}
        </p>

        {/* Mission progress */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-adventure text-adventure-brown text-xl">Missions</h2>
          <span className="text-adventure-gold font-bold text-sm">
            {completedCount} / {missions.length} complétées
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-parchment-300 rounded-full h-2.5 mb-5 border border-adventure-gold/20">
          <div
            className="bg-adventure-gold h-2.5 rounded-full transition-all"
            style={{ width: missions.length > 0 ? `${(completedCount / missions.length) * 100}%` : '0%' }}
          />
        </div>

        {/* Mission list */}
        {loading ? (
          <div className="text-center text-adventure-brown/50 py-8 font-adventure text-lg">
            Chargement des missions…
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {missions.map(mission => {
              const done = collected.includes(mission.id)
              return (
                <div
                  key={mission.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    done
                      ? 'border-adventure-gold bg-adventure-gold/10'
                      : 'border-parchment-300 bg-white/40'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 border-2 ${
                    done ? 'border-adventure-gold bg-adventure-gold/20' : 'border-parchment-300 bg-parchment-200'
                  }`}>
                    {done ? '✅' : (CATEGORY_EMOJI[mission.categorie] || '❓')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${done ? 'text-adventure-brown' : 'text-adventure-brown/50'}`}>
                      {done ? mission.titre : '???'}
                    </p>
                    <p className="text-xs text-adventure-brown/50 mt-0.5">
                      {mission.categorie} {done ? '' : '· 🔒 À découvrir'}
                    </p>
                  </div>

                  {!done && (
                    <span className="text-2xl opacity-40">🔒</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky start button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20"
           style={{ background: 'linear-gradient(transparent, #F5E6C8 40%)' }}>
        <button
          onClick={() => onStart(sentier, missions)}
          className="w-full bg-adventure-gold text-white font-adventure text-xl py-4 rounded-2xl shadow-lg hover:bg-adventure-brown active:scale-95 transition-all"
        >
          🥾 Lancer l'exploration !
        </button>
      </div>
    </div>
  )
}
