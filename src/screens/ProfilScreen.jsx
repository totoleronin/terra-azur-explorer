import React from 'react'

export default function ProfilScreen({ collected = [] }) {
  return (
    <div className="h-full overflow-y-auto parchment-bg font-body pb-20">
      <div className="px-4 pt-12 pb-6">
        <h1 className="font-adventure text-adventure-brown text-3xl mb-6">Profil</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-24 h-24 rounded-full bg-adventure-gold border-4 border-adventure-brown flex items-center justify-center text-5xl shadow-lg">
            🧭
          </div>
          <p className="font-adventure text-adventure-brown text-2xl">Explorateur</p>
          <p className="text-adventure-brown/60 text-sm">Mode invité</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-adventure-brown/10 rounded-2xl p-4 text-center border-2 border-adventure-gold/40">
            <p className="font-adventure text-adventure-brown text-4xl">{collected.length}</p>
            <p className="text-adventure-brown/70 text-sm font-bold mt-1">Missions</p>
          </div>
          <div className="bg-adventure-brown/10 rounded-2xl p-4 text-center border-2 border-adventure-gold/40">
            <p className="font-adventure text-adventure-brown text-4xl">0</p>
            <p className="text-adventure-brown/70 text-sm font-bold mt-1">Sentiers</p>
          </div>
        </div>

        {/* Guest banner */}
        <div className="bg-adventure-gold/20 border-2 border-adventure-gold rounded-2xl p-4 text-center">
          <p className="text-adventure-brown font-bold text-sm mb-2">
            🌟 Crée un compte pour ne pas perdre ta progression !
          </p>
          <button className="bg-adventure-brown text-parchment-200 font-adventure text-lg px-6 py-2 rounded-xl shadow">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  )
}
