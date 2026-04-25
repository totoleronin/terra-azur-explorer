import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  function logout() {
    sessionStorage.removeItem('admin_auth')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      {/* Top bar */}
      <div className="bg-adventure-brown text-parchment-200 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-adventure text-xl">🧭 Admin</span>
          <span className="text-parchment-300/60 text-sm hidden sm:block">Terra Azur Explorer</span>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/admin/sentiers"
            className={({ isActive }) =>
              `text-sm font-bold px-3 py-1 rounded-lg transition-colors ${isActive ? 'bg-adventure-gold text-white' : 'text-parchment-300 hover:text-white'}`
            }>
            🏔️ Sentiers
          </NavLink>
          <NavLink to="/admin/missions"
            className={({ isActive }) =>
              `text-sm font-bold px-3 py-1 rounded-lg transition-colors ${isActive ? 'bg-adventure-gold text-white' : 'text-parchment-300 hover:text-white'}`
            }>
            🎯 Missions
          </NavLink>
          <button onClick={logout}
            className="text-parchment-300/60 hover:text-white text-sm ml-2">
            Quitter ✕
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
