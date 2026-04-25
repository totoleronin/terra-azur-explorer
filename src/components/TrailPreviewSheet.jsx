import React from 'react'

const DIFF_COLOR = { Facile: 'bg-green-600', Moyen: 'bg-yellow-500', Difficile: 'bg-red-600' }

export default function TrailPreviewSheet({ sentier, onClose, onView }) {
  if (!sentier) return null

  return (
    <div className="absolute bottom-20 left-4 right-4 z-30 parchment-bg rounded-2xl border-4 border-adventure-gold shadow-2xl p-5 font-body"
         style={{ backgroundImage: 'none', backgroundColor: '#F5E6C8' }}>
      {/* Handle */}
      <div className="w-10 h-1.5 bg-adventure-gold rounded-full mx-auto mb-3 opacity-60" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="font-adventure text-adventure-brown text-xl leading-tight">{sentier.nom}</h2>
        <button onClick={onClose} className="text-adventure-brown opacity-50 hover:opacity-100 text-xl leading-none mt-0.5">✕</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${DIFF_COLOR[sentier.difficulte] || 'bg-gray-500'}`}>
          {sentier.difficulte}
        </span>
        <span className="text-adventure-brown text-xs font-bold bg-parchment-300 px-2 py-1 rounded-full">
          ⏱ {sentier.duree}
        </span>
        <span className="text-adventure-brown text-xs font-bold bg-parchment-300 px-2 py-1 rounded-full">
          📏 {sentier.distance_km} km
        </span>
        <span className="text-adventure-brown text-xs font-bold bg-parchment-300 px-2 py-1 rounded-full">
          🎯 {sentier.missionCount ?? 4} missions
        </span>
      </div>

      <button
        onClick={() => onView(sentier)}
        className="w-full bg-adventure-gold text-white font-adventure text-lg py-3 rounded-xl shadow-md hover:bg-adventure-brown transition-colors"
      >
        Voir le sentier →
      </button>
    </div>
  )
}
