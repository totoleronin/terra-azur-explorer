import React from 'react'
import { MISSIONS } from '../data/seeds'

const CATEGORY_COLOR = {
  Plante: 'bg-green-700',
  Animal: 'bg-amber-700',
  'Géologie': 'bg-red-800',
  'Point de vue': 'bg-blue-700',
}

export default function CollectionScreen({ collected = [] }) {
  return (
    <div className="h-full overflow-y-auto parchment-bg font-body pb-20">
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-adventure text-adventure-brown text-3xl mb-1">Mes Cartes</h1>
        <p className="text-adventure-brown/70 text-sm">{collected.length} / {MISSIONS.length} découvertes</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {MISSIONS.map(mission => {
          const isUnlocked = collected.includes(mission.id)
          return (
            <div
              key={mission.id}
              className={`rounded-2xl border-4 border-adventure-gold shadow-md overflow-hidden aspect-[3/4] flex flex-col relative ${
                isUnlocked ? 'opacity-100' : 'opacity-50 grayscale'
              }`}
              style={{ background: '#e8d5a3' }}
            >
              {/* Category ribbon */}
              <div className={`text-white text-xs font-bold text-center py-1 ${CATEGORY_COLOR[mission.categorie] || 'bg-gray-600'}`}>
                {mission.categorie}
              </div>

              {/* Illustration placeholder */}
              <div className="flex-1 flex items-center justify-center text-6xl bg-parchment-100">
                {isUnlocked
                  ? mission.categorie === 'Plante' ? '🌳'
                    : mission.categorie === 'Animal' ? '🦌'
                    : mission.categorie === 'Géologie' ? '🪨'
                    : '🏔️'
                  : '❓'}
              </div>

              {/* Card title */}
              <div className="bg-adventure-brown/90 text-parchment-200 text-center px-2 py-1.5">
                <p className="font-adventure text-sm leading-tight">
                  {isUnlocked ? mission.titre : '???'}
                </p>
              </div>

              {/* Lock overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl opacity-70">🔒</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
