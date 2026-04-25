import React from 'react'

const tabs = [
  { id: 'explore', label: 'Explorer', icon: '🗺️' },
  { id: 'collection', label: 'Mes cartes', icon: '🃏' },
  { id: 'profil', label: 'Profil', icon: '🧭' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex bg-adventure-brown border-t-4 border-adventure-gold shadow-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
            active === tab.id
              ? 'text-parchment-200'
              : 'text-parchment-400 opacity-60'
          }`}
        >
          <span className="text-2xl leading-none">{tab.icon}</span>
          <span className="text-xs font-body font-bold tracking-wide">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
