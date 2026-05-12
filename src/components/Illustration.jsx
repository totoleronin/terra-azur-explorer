import React from 'react'

// Slot rules — illustrations are NEVER substituted with category placeholders.
//   /public/illustrations/trails/<trail-id>.png   — cover image for a trail
//   /public/illustrations/missions/<mission-id>.png — collection card for a mission
// If a file is missing, the component renders an empty parchment placeholder
// (the home screen / trail detail will flag the asset gap visually).

export function TrailIllustration({ trail, className = '', style = {} }) {
  const [errored, setErrored] = React.useState(false)
  const src = trail?.id ? `/illustrations/trails/${trail.id}.png` : null

  if (!src || errored) {
    return <MissingArtwork label={trail?.nom || 'Illustration'} className={className} style={style} />
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={style}>
      <img
        src={src}
        alt={trail?.nom || 'sentier'}
        onError={() => setErrored(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

// Mission illustration with 3 visual states:
//   state='locked'    — black silhouette + grayscale, opacity 60%, ? overlay
//   state='nearby'    — silhouette with a soft pulsing orange glow (GPS close)
//   state='unlocked'  — illustration fully revealed (1.5s fade-in)
export function MissionIllustration({ mission, state = 'unlocked', className = '', style = {} }) {
  const [errored, setErrored] = React.useState(false)
  const src = mission?.id ? `/illustrations/missions/${mission.id}.png` : null
  const missing = !src || errored

  // Reset error state if mission changes
  React.useEffect(() => { setErrored(false) }, [mission?.id])

  const baseStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }

  if (missing) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} style={style}>
        <MissingArtwork label="Illustration mission" />
        {state === 'locked' && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ background: 'rgba(43,38,32,0.55)', color: '#f4ecd8', fontSize: 48, fontFamily: 'Caveat, cursive', fontWeight: 700 }}
          >
            ?
          </div>
        )}
      </div>
    )
  }

  // States
  const stateStyles = {
    locked: {
      filter: 'grayscale(1) brightness(0.2)',
      opacity: 0.6,
    },
    nearby: {
      filter: 'grayscale(1) brightness(0.25) drop-shadow(0 0 14px rgba(255,140,60,0.7))',
      opacity: 0.8,
      animation: 'missionNearbyPulse 1.6s ease-in-out infinite',
    },
    unlocked: {
      filter: 'none',
      opacity: 1,
      animation: 'missionReveal 1.5s ease-out both',
    },
  }
  const sStyle = stateStyles[state] || stateStyles.unlocked

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={style}>
      <img
        src={src}
        alt={mission?.titre || 'mission'}
        onError={() => setErrored(true)}
        style={{ ...baseStyle, ...sStyle, transition: 'filter .4s, opacity .4s' }}
      />
      {state === 'locked' && (
        <div
          className="absolute inset-0 grid place-items-center pointer-events-none"
          style={{
            color: '#f4ecd8',
            fontSize: 64,
            fontFamily: 'Caveat, cursive',
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          ?
        </div>
      )}
    </div>
  )
}

// Neutral placeholder when the asset file is missing — does NOT pick a substitute.
function MissingArtwork({ label = 'Illustration', className = '', style = {} }) {
  return (
    <div
      className={`relative w-full h-full grid place-items-center ${className}`}
      style={{
        background:
          'repeating-linear-gradient(45deg, #ebe0c2 0 14px, #e3d4ad 14px 28px)',
        ...style,
      }}
    >
      <div
        className="font-mono uppercase text-center px-3"
        style={{
          color: '#8a7e6c',
          fontSize: 10,
          letterSpacing: 1.5,
          lineHeight: 1.3,
        }}
      >
        ✦ {label} ✦
        <br />
        <span style={{ opacity: 0.7 }}>asset à fournir</span>
      </div>
    </div>
  )
}
