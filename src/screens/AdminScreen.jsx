import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { parseGpxText, simplifyTrack, elevationStats } from '../lib/parseGpx'
import { useTrails } from '../hooks/useTrails'

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'ta-2026-azur-admin'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Styles communs ────────────────────────────────────────────────────────────

const S = {
  field: {
    width: '100%', borderRadius: 10, padding: '11px 14px',
    background: 'rgba(244,236,216,0.06)',
    border: '1px solid rgba(244,236,216,0.18)',
    color: '#f4ecd8', fontSize: 15, fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  },
  label: {
    fontSize: 9, letterSpacing: 1.5, color: '#6a6558',
    fontFamily: 'Lora, serif', textTransform: 'uppercase',
    marginBottom: 5, display: 'block',
  },
  title: { fontFamily: "'Bebas Neue', sans-serif" },
}

// ── FitBounds Leaflet helper ──────────────────────────────────────────────────

function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) {
      try {
        const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]))
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 })
      } catch {}
    }
  }, [JSON.stringify(coords.slice(0, 3)), map])
  return null
}

// ── Marqueur start / end ──────────────────────────────────────────────────────

function dotIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [10, 10], iconAnchor: [5, 5],
  })
}

// ── Mini-carte aperçu GPX ─────────────────────────────────────────────────────

function GpxPreviewMap({ points }) {
  const center = points.length > 0
    ? [points[Math.floor(points.length / 2)][0], points[Math.floor(points.length / 2)][1]]
    : [43.7, 7.2]

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(161,74,60,0.4)', height: 240 }}>
      <MapContainer center={center} zoom={13} zoomControl={false} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={points} />
        <Polyline
          positions={points.map(p => [p[0], p[1]])}
          pathOptions={{ color: '#a14a3c', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
        />
        <Marker position={[points[0][0], points[0][1]]} icon={dotIcon('#4a6b3a')} />
        <Marker position={[points[points.length - 1][0], points[points.length - 1][1]]} icon={dotIcon('#a14a3c')} />
      </MapContainer>
    </div>
  )
}

// ── PIN Gate ──────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const expected = import.meta.env.VITE_ADMIN_PIN || '1234'

  function submit(e) {
    e.preventDefault()
    if (pin === expected) { onUnlock() }
    else {
      setShake(true); setPin('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6"
      style={{ background: '#14180f' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...S.title, fontSize: 38, color: '#f4ecd8', letterSpacing: 2 }}>TERRA AZUR</div>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#6a6558', fontFamily: 'Lora, serif', textTransform: 'uppercase', marginTop: 4 }}>
          Panneau administrateur
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col items-center gap-4">
        <input
          type="password" value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Code PIN"
          maxLength={8} autoFocus
          style={{
            ...S.field, width: 200, fontSize: 28, letterSpacing: 10, textAlign: 'center',
            border: `1.5px solid ${shake ? '#a14a3c' : 'rgba(244,236,216,0.2)'}`,
            animation: shake ? 'shake 0.4s ease' : 'none',
            paddingLeft: 20,
          }}
        />
        {shake && (
          <p style={{ color: '#a14a3c', fontSize: 13, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            Code incorrect
          </p>
        )}
        <button type="submit"
          className="cursor-pointer"
          style={{
            background: '#b8862e', color: '#1c1a14', border: 'none',
            borderRadius: 12, padding: '13px 44px',
            ...S.title, fontSize: 20,
          }}>
          Accéder →
        </button>
      </form>

      <p style={{ fontSize: 10, color: '#3a3730', fontFamily: 'Lora, serif', textAlign: 'center', maxWidth: 220 }}>
        Défini par VITE_ADMIN_PIN dans .env<br />(défaut : 1234)
      </p>
    </div>
  )
}

// ── Liste des sentiers ────────────────────────────────────────────────────────

function TrailList({ onNew, onEdit }) {
  const { trails, loading } = useTrails()

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div style={{ ...S.title, fontSize: 26, color: '#f4ecd8' }}>Sentiers</div>
        <button onClick={onNew}
          className="cursor-pointer flex items-center gap-2"
          style={{
            background: '#b8862e', color: '#1c1a14', border: 'none',
            borderRadius: 10, padding: '9px 18px',
            ...S.title, fontSize: 16,
          }}>
          + Nouveau
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6a6558', fontSize: 14 }}>Chargement…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(trails || []).map(t => (
            <button key={t.id} onClick={() => onEdit(t)}
              className="w-full text-left cursor-pointer"
              style={{
                background: 'rgba(244,236,216,0.05)',
                border: '1px solid rgba(244,236,216,0.1)',
                borderRadius: 12, padding: '14px 16px',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ ...S.title, fontSize: 20, color: '#f4ecd8' }}>{t.nom}</div>
                  <div style={{ fontSize: 12, color: '#6a6558', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                    {[t.difficulte, t.duree, t.distance_km ? `${t.distance_km} km` : null]
                      .filter(Boolean).join(' · ')}
                    {t.gpx_track ? <span style={{ color: '#4a6b3a' }}> · ✓ GPX</span> : ''}
                  </div>
                </div>
                <span style={{ color: '#c9b78a', fontSize: 18 }}>›</span>
              </div>
            </button>
          ))}
          {trails?.length === 0 && (
            <p style={{ color: '#4a4540', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Aucun sentier. Crée le premier !
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Formulaire sentier + import GPX ──────────────────────────────────────────

function TrailForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    id:          initial?.id          || '',
    nom:         initial?.nom         || '',
    description: initial?.description || '',
    region:      initial?.region      || '',
    difficulte:  initial?.difficulte  || 'Facile',
    duree:       initial?.duree       || '',
    distance_km: initial?.distance_km || '',
  })
  const [gpxPoints,   setGpxPoints]   = useState(initial?.gpx_track || [])
  const [gpxFileName, setGpxFileName] = useState(initial?.gpx_track ? '(tracé existant)' : '')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState(null)
  const [saved,       setSaved]       = useState(false)
  const fileRef = useRef(null)

  const ele = gpxPoints.length > 0 ? elevationStats(gpxPoints) : null

  function setField(k, v) {
    setForm(f => ({
      ...f, [k]: v,
      ...(k === 'nom' && !initial?.id ? { id: slugify(v) } : {}),
    }))
  }

  function handleGpx(e) {
    const file = e.target.files[0]
    if (!file) return
    setGpxFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const raw = parseGpxText(ev.target.result)
      const pts = simplifyTrack(raw, 80)
      setGpxPoints(pts)
      // Auto-remplir départ depuis le premier point
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleSave() {
    if (!form.id || !form.nom) return
    setSaving(true); setSaveError(null); setSqlOutput(null)

    const payload = {
      ...form,
      distance_km: parseFloat(form.distance_km) || null,
      lat_depart:  gpxPoints[0]?.[0] ?? initial?.lat_depart ?? null,
      lng_depart:  gpxPoints[0]?.[1] ?? initial?.lng_depart ?? null,
      gpx_track:   gpxPoints.length > 0 ? gpxPoints        : initial?.gpx_track ?? null,
      route_coords: gpxPoints.length > 0 ? gpxPoints.map(p => [p[0], p[1]]) : initial?.route_coords ?? null,
    }

    const { error } = await supabase.rpc('admin_save_sentier', {
      p_token: ADMIN_TOKEN,
      p_data: payload,
    })

    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved() }, 1200)
  }

  return (
    <div className="pb-10">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#c9b78a', cursor: 'pointer', fontSize: 26, padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div style={{ ...S.title, fontSize: 28, color: '#f4ecd8' }}>
          {initial?.id ? 'Modifier le sentier' : 'Nouveau sentier'}
        </div>
      </div>

      {/* Nom */}
      <div className="mb-3">
        <label style={S.label}>Nom du sentier *</label>
        <input value={form.nom} onChange={e => setField('nom', e.target.value)}
          placeholder="ex. Baous Saint-Jeannet" style={S.field} />
      </div>

      {/* Identifiant */}
      <div className="mb-4">
        <label style={S.label}>Identifiant (auto)</label>
        <input value={form.id} onChange={e => setField('id', e.target.value)}
          placeholder="baous-saint-jeannet"
          style={{ ...S.field, fontSize: 13, color: '#8a7e6c', fontFamily: 'monospace' }} />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label style={S.label}>Description</label>
        <textarea value={form.description} onChange={e => setField('description', e.target.value)}
          rows={3} placeholder="Un sentier panoramique au-dessus du village…"
          style={{ ...S.field, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {/* Région + Difficulté */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label style={S.label}>Région</label>
          <input value={form.region} onChange={e => setField('region', e.target.value)}
            placeholder="Alpes-Maritimes" style={S.field} />
        </div>
        <div className="flex-1">
          <label style={S.label}>Difficulté</label>
          <select value={form.difficulte} onChange={e => setField('difficulte', e.target.value)}
            style={S.field}>
            <option>Facile</option>
            <option>Moyen</option>
            <option>Difficile</option>
          </select>
        </div>
      </div>

      {/* Durée + Distance */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label style={S.label}>Durée estimée</label>
          <input value={form.duree} onChange={e => setField('duree', e.target.value)}
            placeholder="1h30" style={S.field} />
        </div>
        <div className="flex-1">
          <label style={S.label}>Distance (km)</label>
          <input type="number" step="0.1" value={form.distance_km}
            onChange={e => setField('distance_km', e.target.value)}
            placeholder="4.9" style={S.field} />
        </div>
      </div>

      {/* ── Import GPX ── */}
      <label style={{ ...S.label, marginBottom: 8 }}>Tracé GPX</label>

      <button onClick={() => fileRef.current?.click()}
        className="w-full cursor-pointer flex items-center justify-center gap-3 mb-4"
        style={{
          height: 58, borderRadius: 14,
          background: gpxPoints.length > 0
            ? 'rgba(74,107,58,0.12)' : 'rgba(244,236,216,0.04)',
          border: `1.5px dashed ${gpxPoints.length > 0 ? '#4a6b3a' : 'rgba(244,236,216,0.18)'}`,
          color: gpxPoints.length > 0 ? '#6a9e5a' : '#6a6558',
          fontSize: 14, fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s',
        }}>
        {gpxPoints.length > 0
          ? `✓ ${gpxFileName}  ·  ${gpxPoints.length} pts${ele ? `  ·  ↑ ${ele.delta}m  (${ele.min}–${ele.max}m)` : ''}`
          : '📂  Importer un fichier .gpx'}
      </button>
      <input ref={fileRef} type="file" accept=".gpx,.xml"
        style={{ display: 'none' }} onChange={handleGpx} />

      {/* ── Aperçu carte ── */}
      {gpxPoints.length >= 2 && (
        <div className="mb-6">
          <GpxPreviewMap points={gpxPoints} />
          <div className="flex justify-between mt-2 px-1">
            <span style={{ fontSize: 10, color: '#4a6b3a', fontFamily: 'Lora, serif' }}>● Départ</span>
            {ele && (
              <span style={{ fontSize: 10, color: '#b8862e', fontFamily: 'Lora, serif' }}>
                Dénivelé +{ele.delta} m
              </span>
            )}
            <span style={{ fontSize: 10, color: '#a14a3c', fontFamily: 'Lora, serif' }}>● Arrivée</span>
          </div>
        </div>
      )}

      {/* ── Bouton sauvegarder ── */}
      <button onClick={handleSave}
        disabled={saving || !form.id || !form.nom}
        className="w-full cursor-pointer"
        style={{
          height: 54, borderRadius: 14,
          background: saved ? '#4a6b3a' : (!form.id || !form.nom ? 'rgba(184,134,46,0.25)' : '#b8862e'),
          color: saved ? '#f4ecd8' : '#1c1a14',
          border: 'none', ...S.title, fontSize: 22,
          opacity: saving ? 0.7 : 1,
          transition: 'background 0.3s',
        }}>
        {saved ? '✓ Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer le sentier →'}
      </button>



      {saveError && (
        <p style={{ color: '#a14a3c', fontSize: 13, marginTop: 10, fontFamily: 'Inter, sans-serif' }}>
          ⚠️ {saveError}
        </p>
      )}
    </div>
  )
}

// ── AdminScreen ───────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const [unlocked,     setUnlocked]     = useState(false)
  const [view,         setView]         = useState('list')   // 'list' | 'form'
  const [editingTrail, setEditingTrail] = useState(null)
  const [refreshKey,   setRefreshKey]   = useState(0)

  function openNew()    { setEditingTrail(null); setView('form') }
  function openEdit(t)  { setEditingTrail(t);    setView('form') }
  function onSaved()    { setRefreshKey(k => k + 1); setView('list') }
  function onCancel()   { setView('list') }

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

  return (
    <div className="w-full h-full overflow-y-auto font-body"
      style={{ background: '#14180f', color: '#f4ecd8' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(244,236,216,0.07)' }}>
        <div>
          <div style={{ ...S.title, fontSize: 22, color: '#f4ecd8', letterSpacing: 1 }}>ADMIN</div>
          <div style={{ fontSize: 9, color: '#4a4540', fontFamily: 'Lora, serif', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Terra Azur Explorer
          </div>
        </div>
        <div style={{
          fontSize: 9, color: '#4a6b3a', fontFamily: 'Lora, serif',
          background: 'rgba(74,107,58,0.1)', border: '1px solid rgba(74,107,58,0.2)',
          borderRadius: 8, padding: '4px 10px', textAlign: 'center',
        }}>
          ✓ Connecté<br />Supabase
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="px-5 py-5">
        {view === 'list' ? (
          <TrailList key={refreshKey} onNew={openNew} onEdit={openEdit} />
        ) : (
          <TrailForm initial={editingTrail} onSaved={onSaved} onCancel={onCancel} />
        )}
      </div>
    </div>
  )
}
