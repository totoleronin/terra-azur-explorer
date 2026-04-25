import React, { useState } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'terra2024'

export default function AdminLogin({ onSuccess }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', '1')
      onSuccess()
    } else {
      setError(true)
      setPwd('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center parchment-bg font-body px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border-4 border-adventure-gold p-8">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-3">🔐</span>
          <h1 className="font-adventure text-adventure-brown text-3xl">Panel Admin</h1>
          <p className="text-adventure-brown/60 text-sm mt-1">Terra Azur Explorer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(false) }}
            placeholder="Mot de passe"
            className="w-full border-2 border-parchment-300 rounded-xl px-4 py-3 text-adventure-brown focus:outline-none focus:border-adventure-gold"
            autoFocus
          />
          {error && (
            <p className="text-red-600 text-sm text-center font-bold">Mot de passe incorrect</p>
          )}
          <button
            type="submit"
            className="w-full bg-adventure-gold text-white font-adventure text-xl py-3 rounded-xl hover:bg-adventure-brown transition-colors"
          >
            Entrer
          </button>
        </form>

        <p className="text-center text-adventure-brown/40 text-xs mt-4">
          Mot de passe par défaut : <code>terra2024</code>
        </p>
      </div>
    </div>
  )
}
