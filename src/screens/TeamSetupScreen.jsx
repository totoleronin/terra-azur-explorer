import React, { useState } from 'react'

// Stores the team data so the rest of the app (HikeScreen, recap) can read it
function persistTeam(team) {
  try { localStorage.setItem('terra.team', JSON.stringify(team)) } catch {}
}

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `AZUR-${code}`
}

export default function TeamSetupScreen({ sentier, onBack, onReady }) {
  // 'pick' | 'family' | 'collab-pick' | 'collab-host' | 'collab-join'
  const [step, setStep] = useState('pick')

  // Family mode state
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState([''])

  // Collab state
  const [sessionCode, setSessionCode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')

  const updateMember = (i, value) => {
    setMembers(prev => prev.map((m, idx) => idx === i ? value : m))
  }
  const addMember = () => {
    if (members.length >= 6) return
    setMembers(prev => [...prev, ''])
  }
  const removeMember = i => {
    setMembers(prev => prev.filter((_, idx) => idx !== i))
  }

  const startFamily = () => {
    const cleanMembers = members.map(m => m.trim()).filter(Boolean)
    if (cleanMembers.length === 0) return
    const team = {
      mode: 'family',
      name: teamName.trim() || 'Mon équipe',
      members: cleanMembers,
      sentierId: sentier.id,
      createdAt: new Date().toISOString(),
    }
    persistTeam(team)
    onReady(team)
  }

  const startCollabHost = () => {
    if (!sessionCode) return
    const cleanMembers = members.map(m => m.trim()).filter(Boolean)
    const team = {
      mode: 'collab-host',
      name: teamName.trim() || 'Session ' + sessionCode,
      members: cleanMembers.length > 0 ? cleanMembers : ['Hôte'],
      sessionCode,
      sentierId: sentier.id,
      createdAt: new Date().toISOString(),
    }
    persistTeam(team)
    onReady(team)
  }

  const startCollabJoin = () => {
    if (!joinCode.trim() || !joinName.trim()) return
    const team = {
      mode: 'collab-join',
      name: 'Session ' + joinCode.trim().toUpperCase(),
      members: [joinName.trim()],
      sessionCode: joinCode.trim().toUpperCase(),
      sentierId: sentier.id,
      createdAt: new Date().toISOString(),
    }
    persistTeam(team)
    onReady(team)
  }

  // ──────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden parchment-bg parchment-grain font-body text-ink">
      {/* TOP BAR */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{ height: 56 }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full grid place-items-center cursor-pointer"
          style={{ background: '#f9f1de', border: '1.5px solid #2b2620', boxShadow: '1.5px 1.5px 0 #2b2620' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2 L4 7 L9 12" stroke="#2b2620" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-label uppercase text-ink-mute" style={{ fontSize: 10, letterSpacing: 1.5 }}>
          Préparer l'équipée
        </span>
        <div className="w-9 h-9" />
      </div>

      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar" style={{ paddingTop: 64, paddingBottom: 32 }}>

        {/* HEADER */}
        <div className="px-[18px] pt-2 pb-4 animate-fadeUp">
          <div className="font-label uppercase text-ink-mute mb-1" style={{ fontSize: 10, letterSpacing: 2 }}>
            {sentier?.nom}
          </div>
          <h1 className="font-title text-ink m-0 leading-none" style={{ fontSize: 36, fontWeight: 400 }}>
            Avec qui pars-tu <span style={{ color: '#1c4f4c' }}>explorer ?</span>
          </h1>
        </div>

        {/* STEP: PICK MODE */}
        {step === 'pick' && (
          <div className="px-[18px] flex flex-col gap-3 animate-fadeUp">
            <ModeCard
              tone="primary"
              title="Solo / Famille"
              subtitle="Un seul téléphone. Une équipe de 1 à 6 Explorateurs partagent le sentier."
              icon={<GroupIcon />}
              onClick={() => setStep('family')}
            />
            <ModeCard
              tone="secondary"
              title="Collaboration"
              subtitle="Plusieurs téléphones, une exploration commune. Code de session partagé."
              icon={<NetworkIcon />}
              onClick={() => setStep('collab-pick')}
              badge="Bêta"
            />
          </div>
        )}

        {/* STEP: FAMILY SETUP */}
        {step === 'family' && (
          <div className="px-[18px] animate-fadeUp">
            <SectionTitle>Le nom de l'équipée</SectionTitle>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Ex : La famille Martin, Les Trailblazers…"
              className="w-full font-body text-ink mb-5"
              style={inputStyle}
            />

            <SectionTitle>Les Explorateurs ({members.filter(m => m.trim()).length}/6)</SectionTitle>
            <div className="flex flex-col gap-2 mb-3">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full grid place-items-center font-label flex-none"
                    style={{ background: '#2b2620', color: '#f4ecd8', border: '1.5px solid #2b2620', fontSize: 12 }}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={m}
                    onChange={e => updateMember(i, e.target.value)}
                    placeholder="Prénom"
                    className="flex-1 font-body text-ink"
                    style={inputStyle}
                  />
                  {members.length > 1 && (
                    <button
                      onClick={() => removeMember(i)}
                      className="w-9 h-9 rounded-full grid place-items-center cursor-pointer flex-none"
                      style={{ background: '#f9f1de', border: '1.5px solid #8a7e6c', color: '#8a7e6c' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {members.length < 6 && (
              <button
                onClick={addMember}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-6 cursor-pointer"
                style={{
                  background: 'transparent',
                  border: '1.5px dashed #8a7e6c',
                  color: '#5a4f42',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                }}
              >
                + Ajouter un Explorateur
              </button>
            )}

            <button
              onClick={startFamily}
              disabled={members.filter(m => m.trim()).length === 0}
              className="w-full h-[54px] cursor-pointer font-title flex items-center justify-center gap-2.5"
              style={{
                background: '#2b2620',
                color: '#f4ecd8',
                border: '2px solid #2b2620',
                borderRadius: 14,
                fontSize: 22,
                letterSpacing: 1,
                boxShadow: '3px 3px 0 #b8862e',
                opacity: members.filter(m => m.trim()).length === 0 ? 0.55 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M5 2 L14 9 L5 16 Z" fill="#b8862e" stroke="#b8862e" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              DÉMARRER LE SENTIER
            </button>

            <button
              onClick={() => setStep('pick')}
              className="w-full mt-3 py-2 cursor-pointer font-label text-ink-mute"
              style={{ background: 'transparent', border: 'none', fontSize: 13, letterSpacing: 1 }}
            >
              ← Changer de mode
            </button>
          </div>
        )}

        {/* STEP: COLLAB PICK */}
        {step === 'collab-pick' && (
          <div className="px-[18px] flex flex-col gap-3 animate-fadeUp">
            <SectionTitle>Mode Collaboration</SectionTitle>
            <p className="font-body text-ink-soft m-0 mb-3 leading-snug" style={{ fontSize: 14 }}>
              Plusieurs téléphones connectés à la même exploration. Synchronisation des missions en temps réel.
            </p>

            <ModeCard
              tone="primary"
              title="Créer une session"
              subtitle="Tu génères un code et tu le partages avec les autres Explorateurs."
              icon={<HostIcon />}
              onClick={() => { setSessionCode(generateSessionCode()); setStep('collab-host') }}
            />
            <ModeCard
              tone="secondary"
              title="Rejoindre une session"
              subtitle="Tu entres le code partagé par l'hôte pour rejoindre la session."
              icon={<JoinIcon />}
              onClick={() => setStep('collab-join')}
            />

            <button
              onClick={() => setStep('pick')}
              className="w-full mt-3 py-2 cursor-pointer font-label text-ink-mute"
              style={{ background: 'transparent', border: 'none', fontSize: 13, letterSpacing: 1 }}
            >
              ← Changer de mode
            </button>
          </div>
        )}

        {/* STEP: COLLAB HOST */}
        {step === 'collab-host' && (
          <div className="px-[18px] animate-fadeUp">
            <SectionTitle>Code de session</SectionTitle>
            <div
              className="text-center py-5 rounded-2xl mb-3"
              style={{
                background: '#fff8e6',
                border: '2px solid #b8862e',
                boxShadow: '3px 3px 0 #b8862e',
              }}
            >
              <div className="font-label uppercase text-ink-mute mb-1" style={{ fontSize: 10, letterSpacing: 2 }}>
                Partage ce code
              </div>
              <div
                className="font-title text-ink"
                style={{ fontSize: 44, letterSpacing: 4, lineHeight: 1, color: '#1c4f4c' }}
              >
                {sessionCode}
              </div>
              <button
                onClick={() => { navigator.clipboard?.writeText(sessionCode) }}
                className="mt-2.5 px-3.5 py-1 rounded-full cursor-pointer font-label uppercase"
                style={{
                  background: '#2b2620',
                  color: '#f4ecd8',
                  border: '1.5px solid #2b2620',
                  fontSize: 10,
                  letterSpacing: 1.5,
                }}
              >
                📋 Copier
              </button>
            </div>

            <SectionTitle>Ton prénom (hôte)</SectionTitle>
            <input
              value={members[0]}
              onChange={e => updateMember(0, e.target.value)}
              placeholder="Prénom"
              className="w-full font-body text-ink mb-5"
              style={inputStyle}
            />

            <button
              onClick={startCollabHost}
              disabled={!members[0]?.trim()}
              className="w-full h-[54px] cursor-pointer font-title flex items-center justify-center gap-2.5"
              style={{
                background: '#2b2620',
                color: '#f4ecd8',
                border: '2px solid #2b2620',
                borderRadius: 14,
                fontSize: 22,
                letterSpacing: 1,
                boxShadow: '3px 3px 0 #b8862e',
                opacity: !members[0]?.trim() ? 0.55 : 1,
              }}
            >
              DÉMARRER LA SESSION
            </button>

            <button
              onClick={() => setStep('collab-pick')}
              className="w-full mt-3 py-2 cursor-pointer font-label text-ink-mute"
              style={{ background: 'transparent', border: 'none', fontSize: 13, letterSpacing: 1 }}
            >
              ← Retour
            </button>
          </div>
        )}

        {/* STEP: COLLAB JOIN */}
        {step === 'collab-join' && (
          <div className="px-[18px] animate-fadeUp">
            <SectionTitle>Code de la session</SectionTitle>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="AZUR-XXXX"
              maxLength={9}
              className="w-full font-title text-center mb-5"
              style={{
                ...inputStyle,
                fontSize: 28,
                letterSpacing: 3,
                color: '#1c4f4c',
              }}
            />

            <SectionTitle>Ton prénom</SectionTitle>
            <input
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              placeholder="Prénom"
              className="w-full font-body text-ink mb-5"
              style={inputStyle}
            />

            <button
              onClick={startCollabJoin}
              disabled={!joinCode.trim() || !joinName.trim()}
              className="w-full h-[54px] cursor-pointer font-title flex items-center justify-center gap-2.5"
              style={{
                background: '#2b2620',
                color: '#f4ecd8',
                border: '2px solid #2b2620',
                borderRadius: 14,
                fontSize: 22,
                letterSpacing: 1,
                boxShadow: '3px 3px 0 #b8862e',
                opacity: !joinCode.trim() || !joinName.trim() ? 0.55 : 1,
              }}
            >
              REJOINDRE
            </button>

            <button
              onClick={() => setStep('collab-pick')}
              className="w-full mt-3 py-2 cursor-pointer font-label text-ink-mute"
              style={{ background: 'transparent', border: 'none', fontSize: 13, letterSpacing: 1 }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div
      className="font-label uppercase text-ink-mute mb-1.5"
      style={{ fontSize: 10, letterSpacing: 1.8 }}
    >
      {children}
    </div>
  )
}

function ModeCard({ tone, title, subtitle, icon, onClick, badge }) {
  const isPrimary = tone === 'primary'
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 p-4 rounded-2xl cursor-pointer"
      style={{
        background: isPrimary ? '#fff8e6' : '#f9f1de',
        border: isPrimary ? '1.5px solid #b8862e' : '1.5px solid #2b2620',
        boxShadow: '3px 3px 0 #2b2620',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl grid place-items-center flex-none"
        style={{
          background: isPrimary ? '#1c4f4c' : '#2b2620',
          color: '#f4ecd8',
          border: '1.5px solid #2b2620',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-title text-ink leading-none" style={{ fontSize: 22, letterSpacing: 0.5 }}>
            {title.toUpperCase()}
          </div>
          {badge && (
            <span
              className="font-label uppercase rounded-full px-2 py-0.5"
              style={{
                fontSize: 8,
                letterSpacing: 1.3,
                color: '#b8862e',
                border: '1px solid #b8862e',
                background: '#fff',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="font-body text-ink-soft leading-snug" style={{ fontSize: 13 }}>
          {subtitle}
        </div>
      </div>
      <span
        className="w-7 h-7 rounded-full grid place-items-center font-title flex-none"
        style={{ background: '#2b2620', color: '#f4ecd8', fontSize: 18 }}
      >
        ›
      </span>
    </button>
  )
}

const inputStyle = {
  background: '#f9f1de',
  border: '1.5px solid #2b2620',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 16,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ── Icons ──
function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="3" />
      <circle cx="16" cy="8" r="2.5" />
      <path d="M2 19 C 3 14 13 14 14 19" />
      <path d="M14 16 C 15 13 20 13 20.5 17" />
    </svg>
  )
}
function NetworkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="6" r="2.5" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
      <path d="M11 8.5 L 5 13.5 M 11 8.5 L 17 13.5 M 7.5 16 L 14.5 16" />
    </svg>
  )
}
function HostIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="16" height="12" rx="2" />
      <path d="M11 6 L 11 3 M 8 3 L 14 3" />
      <path d="M7 11 H 15 M 7 14 H 12" />
    </svg>
  )
}
function JoinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 L 14 11 M 10 7 L 14 11 L 10 15" />
      <rect x="14" y="4" width="5" height="14" rx="1" />
    </svg>
  )
}
