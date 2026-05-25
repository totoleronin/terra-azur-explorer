import React, { useRef, useState } from 'react'

// Page de carnet manuscrit — fond parchemin, police Caveat, bouton "Écouter" (TTS)
//
// Props:
//   pageNumber       — numéro de page (int)
//   naturalist       — nom du naturaliste affiché en signature
//   text             — texte manuscrit du carnet
//   audioUrl         — (optionnel) URL d'un MP3. Sinon, fallback Web Speech API.
//
export default function NarrativePage({ pageNumber, naturalist, text, audioUrl }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)
  const utteranceRef = useRef(null)

  function play() {
    if (playing) { stop(); return }
    setPlaying(true)
    if (audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      audioRef.current.onended = () => setPlaying(false)
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'fr-FR'
      u.rate = 0.95
      u.pitch = 1
      u.onend = () => setPlaying(false)
      utteranceRef.current = u
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } else {
      setPlaying(false)
    }
  }
  function stop() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setPlaying(false)
  }

  return (
    <div
      className="relative rounded-2xl px-5 py-5 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #fdf5e1 0%, #f0e1b8 100%)',
        border: '1.5px solid #b8862e',
        boxShadow:
          '3px 3px 0 #b8862e, inset 0 0 60px rgba(139,105,20,0.12)',
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 28px, rgba(139,105,20,0.08) 28px, rgba(139,105,20,0.08) 29px)',
      }}
    >
      {/* Coin corné en haut-droite */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderTop: '24px solid #ebe0c2',
          borderLeft: '24px solid transparent',
          filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.15))',
        }}
      />

      {/* Numéro de page */}
      <div
        className="font-label uppercase mb-2 flex items-center justify-between"
        style={{ fontSize: 10, letterSpacing: 1.8, color: '#8a7e6c' }}
      >
        <span>Page {pageNumber}</span>
        <button
          onClick={play}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer font-label uppercase"
          style={{
            background: playing ? '#a14a3c' : '#2b2620',
            color: '#f4ecd8',
            border: '1.5px solid #2b2620',
            fontSize: 9,
            letterSpacing: 1.3,
          }}
        >
          {playing ? (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="2.5" height="6" fill="currentColor"/><rect x="5.5" y="2" width="2.5" height="6" fill="currentColor"/></svg>
              Stop
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9 Z" fill="currentColor"/></svg>
              Écouter
            </>
          )}
        </button>
      </div>

      {/* Texte manuscrit Caveat */}
      <p
        className="font-journal text-ink m-0"
        style={{
          fontSize: 22,
          lineHeight: 1.35,
          letterSpacing: 0.2,
          fontWeight: 500,
        }}
      >
        {text}
      </p>

      {/* Signature naturaliste */}
      {naturalist && (
        <div
          className="font-journal text-right mt-3 italic"
          style={{ fontSize: 18, color: '#5a4f42', opacity: 0.85 }}
        >
          — {naturalist}
        </div>
      )}
    </div>
  )
}
