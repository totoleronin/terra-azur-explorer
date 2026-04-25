import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './AdminLogin'
import SentiersAdmin from './SentiersAdmin'
import MissionsAdmin from './MissionsAdmin'

export default function AdminRoot() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === '1')

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />

  return (
    <Routes>
      <Route path="sentiers" element={<SentiersAdmin />} />
      <Route path="missions" element={<MissionsAdmin />} />
      <Route path="*" element={<Navigate to="sentiers" replace />} />
    </Routes>
  )
}
