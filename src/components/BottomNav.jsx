import React from 'react'

const ICONS = {
  explore: (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path
        d="M3 7 L7 5 L13 8 L17 6 L17 15 L13 17 L7 14 L3 16 Z M7 5 L7 14 M13 8 L13 17"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  ),
  collection: (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path
        d="M10 2 L12 7 L17 7.5 L13.5 11 L14.5 16 L10 13.5 L5.5 16 L6.5 11 L3 7.5 L8 7 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profil: (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M3 17 C 4 12 16 12 17 17"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
}

const TABS = [
  { id: 'explore',    label: 'Carte',  icon: 'explore' },
  { id: 'collection', label: 'Carnet', icon: 'collection' },
  { id: 'profil',     label: 'Profil', icon: 'profil' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center"
      style={{
        background: '#1f1c17',
        color: '#e8dcbf',
        padding: '8px 0 22px',
        borderTop: '1px solid #3a342c',
      }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="bg-transparent border-none cursor-pointer flex flex-col items-center gap-0.5 px-2.5 py-1 relative"
            style={{ color: isActive ? '#f4ecd8' : '#8a7e6c' }}
          >
            {ICONS[tab.icon]}
            <span
              className="font-mono uppercase"
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm"
                style={{ width: 14, height: 2, background: '#b8862e' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
