import React, { useState, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'ta-2026-azur-admin'

const CATEGORIES = ['Plante', 'Animal', 'Géologie', 'Point de vue', 'Histoire', 'Patrimoine']

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

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

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

function pinIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:${color};border:2px solid #f4ecd8;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#f4ecd8;font-size:14px;font-family:Inter,sans-serif;">${label}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  })
}

// ── Liste des missions d'un sentier ──────────────────────────────────────────

export function MissionList({ trail, onBack, onEdit, onNew }) {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: mData }, { data: nData }] = await Promise.all([
        supabase.from('missions').select('*').eq('sentier_id', trail.id),
        supabase.from('mission_narrative').select('mission_id, page_number'),
      ])
      const pageMap = Object.fromEntries((nData || []).map(n => [n.mission_id, n.page_number]))
      const merged = (mData || [])
        .map(m => ({ ...m, page_number: pageMap[m.id] ?? null }))
        .sort((a, b) => (a.page_number ?? 99) - (b.page_number ?? 99))
      setMissions(merged)
      setLoading(false)
    }
    load()
  }, [trail.id, refreshKey])

  async function handleDelete(m) {
    if (!confirm(`Supprimer la mission « ${m.titre} » ?`)) return
    const { error } = await supabase.rpc('admin_delete_mission', {
      p_token: ADMIN_TOKEN, p_mission_id: m.id,
    })
    if (error) { alert('Erreur : ' + error.message); return }
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#c9b78a', cursor: 'pointer', fontSize: 26, padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#6a6558', fontFamily: 'Lora, serif', textTransform: 'uppercase' }}>
            {trail.nom}
          </div>
          <div style={{ ...S.title, fontSize: 26, color: '#f4ecd8' }}>Missions</div>
        </div>
      </div>

      <button onClick={onNew}
        className="w-full cursor-pointer mb-5"
        style={{
          background: '#b8862e', color: '#1c1a14', border: 'none',
          borderRadius: 12, padding: '12px 18px',
          ...S.title, fontSize: 18,
        }}>
        + Nouvelle mission
      </button>

      {loading ? (
        <p style={{ color: '#6a6558', fontSize: 14 }}>Chargement…</p>
      ) : missions.length === 0 ? (
        <p style={{ color: '#4a4540', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          Aucune mission. Crée la première !
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map(m => (
            <div key={m.id}
              style={{
                background: 'rgba(244,236,216,0.05)',
                border: '1px solid rgba(244,236,216,0.1)',
                borderRadius: 12, padding: '14px 16px',
              }}>
              <div className="flex items-center justify-between">
                <button onClick={() => onEdit(m)} className="text-left cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 22 }}>{m.icone || '📍'}</span>
                    <div>
                      <div style={{ ...S.title, fontSize: 18, color: '#f4ecd8' }}>{m.titre}</div>
                      <div style={{ fontSize: 11, color: '#6a6558', fontFamily: 'Inter, sans-serif' }}>
                        {[m.categorie, m.page_number != null ? `p.${m.page_number}` : null, `r=${m.rayon_metres}m`]
                          .filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                </button>
                <button onClick={() => handleDelete(m)}
                  className="cursor-pointer"
                  style={{ background: 'none', border: 'none', color: '#a14a3c', fontSize: 18, padding: '4px 8px' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulaire mission avec slider de placement ──────────────────────────────

export function MissionForm({ trail, initial, narrativeInitial, onSaved, onCancel }) {
  const track = trail.gpx_track || trail.route_coords || []
  const hasTrack = track.length >= 2

  const initialIdx = useMemo(() => {
    if (!initial || !hasTrack) return Math.floor(track.length / 2)
    // trouver le point le plus proche
    let best = 0, bestD = Infinity
    track.forEach((p, i) => {
      const d = (p[0] - initial.lat) ** 2 + (p[1] - initial.lng) ** 2
      if (d < bestD) { bestD = d; best = i }
    })
    return best
  }, [initial, track])

  const [trackIdx, setTrackIdx] = useState(initialIdx)
  const [customPos, setCustomPos] = useState(initial ? [initial.lat, initial.lng] : null)
  const [useCustom, setUseCustom] = useState(false)

  const pos = useCustom && customPos
    ? customPos
    : (hasTrack ? [track[trackIdx][0], track[trackIdx][1]] : [trail.lat_depart || 43.7, trail.lng_depart || 7.2])

  const [form, setForm] = useState({
    id:           initial?.id           || '',
    titre:        initial?.titre        || '',
    categorie:    initial?.categorie    || 'Plante',
    icone:        initial?.icone        || '🌿',
    rayon_metres: initial?.rayon_metres ?? 50,
    rayon_approche_metres: initial?.rayon_approche_metres ?? 200,
    texte:        initial?.texte        || '',
    question:     initial?.question     || '',
    choix:        initial?.choix        || ['', '', ''],
    bonne_reponse: initial?.bonne_reponse ?? 0,
    indice:       initial?.indice       || '',
    image_url:    initial?.image_url    || '',
  })
  const [narr, setNarr] = useState({
    page_number:  narrativeInitial?.page_number ?? '',
    journal_text: narrativeInitial?.journal_text || '',
    audio_url:    narrativeInitial?.audio_url || '',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function setField(k, v) {
    setForm(f => ({
      ...f, [k]: v,
      ...(k === 'titre' && !initial?.id ? { id: slugify(v) } : {}),
    }))
  }

  function setChoix(i, v) {
    setForm(f => ({ ...f, choix: f.choix.map((c, idx) => idx === i ? v : c) }))
  }

  async function handleSave() {
    if (!form.id || !form.titre) { setError('Titre et identifiant requis'); return }
    setSaving(true); setError(null)

    const payload = {
      ...form,
      sentier_id: trail.id,
      lat: pos[0], lng: pos[1],
      rayon_metres: parseInt(form.rayon_metres) || 50,
      rayon_approche_metres: parseInt(form.rayon_approche_metres) || 200,
      bonne_reponse: parseInt(form.bonne_reponse) || 0,
    }

    const narrPayload = narr.page_number !== '' ? {
      page_number: parseInt(narr.page_number),
      journal_text: narr.journal_text || null,
      audio_url: narr.audio_url || null,
    } : null

    const { error: err } = await supabase.rpc('admin_save_mission', {
      p_token: ADMIN_TOKEN,
      p_mission: payload,
      p_narrative: narrPayload,
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved() }, 1200)
  }

  const center = hasTrack
    ? [track[Math.floor(track.length / 2)][0], track[Math.floor(track.length / 2)][1]]
    : pos

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#c9b78a', cursor: 'pointer', fontSize: 26, padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div style={{ ...S.title, fontSize: 26, color: '#f4ecd8' }}>
          {initial?.id ? 'Modifier la mission' : 'Nouvelle mission'}
        </div>
      </div>

      {/* ── Carte placement ── */}
      <label style={{ ...S.label, marginBottom: 8 }}>Position sur le tracé</label>
      {hasTrack ? (
        <>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(161,74,60,0.4)', height: 280, marginBottom: 12 }}>
            <MapContainer center={center} zoom={14} zoomControl={true} style={{ width: '100%', height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBounds coords={track} />
              <Polyline positions={track.map(p => [p[0], p[1]])}
                pathOptions={{ color: '#a14a3c', weight: 4, opacity: 0.85 }} />
              <Circle center={pos} radius={form.rayon_metres}
                pathOptions={{ color: '#b8862e', fillColor: '#b8862e', fillOpacity: 0.15, weight: 1.5 }} />
              <Marker
                position={pos}
                icon={pinIcon('#a14a3c', form.icone || '?')}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng()
                    setCustomPos([lat, lng])
                    setUseCustom(true)
                  },
                }}
              />
            </MapContainer>
          </div>

          <div className="mb-1 flex items-center justify-between" style={{ fontSize: 11, color: '#6a6558', fontFamily: 'Lora, serif' }}>
            <span>Slider : début du tracé → fin</span>
            <span>{useCustom ? '📍 Position personnalisée' : `Point ${trackIdx + 1}/${track.length}`}</span>
          </div>
          <input
            type="range" min={0} max={track.length - 1} value={trackIdx}
            onChange={e => { setTrackIdx(parseInt(e.target.value)); setUseCustom(false) }}
            style={{ width: '100%', accentColor: '#b8862e' }}
          />
          {useCustom && (
            <button onClick={() => { setUseCustom(false); setCustomPos(null) }}
              className="cursor-pointer mt-1"
              style={{ background: 'none', border: 'none', color: '#c9b78a', fontSize: 11, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
              ↩ Re-snapper au tracé
            </button>
          )}
          <div style={{ fontSize: 10, color: '#4a4540', fontFamily: 'monospace', marginTop: 6, marginBottom: 18 }}>
            {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          </div>
        </>
      ) : (
        <p style={{ color: '#a14a3c', fontSize: 13, marginBottom: 18, fontFamily: 'Inter, sans-serif' }}>
          ⚠️ Ce sentier n'a pas encore de tracé GPX. Importe-le d'abord dans la fiche sentier.
        </p>
      )}

      {/* ── Titre + ID ── */}
      <div className="mb-3">
        <label style={S.label}>Titre *</label>
        <input value={form.titre} onChange={e => setField('titre', e.target.value)}
          placeholder="Le chêne pubescent" style={S.field} />
      </div>

      <div className="mb-3">
        <label style={S.label}>Identifiant (auto) — = nom du fichier illustration</label>
        <input value={form.id} onChange={e => setField('id', e.target.value)}
          placeholder="chene-pubescent"
          style={{ ...S.field, fontSize: 13, color: '#8a7e6c', fontFamily: 'monospace' }} />
      </div>

      {/* ── Catégorie + emoji ── */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label style={S.label}>Catégorie</label>
          <select value={form.categorie} onChange={e => setField('categorie', e.target.value)} style={S.field}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ width: 90 }}>
          <label style={S.label}>Icône</label>
          <input value={form.icone} onChange={e => setField('icone', e.target.value)}
            placeholder="🌿" maxLength={3}
            style={{ ...S.field, textAlign: 'center', fontSize: 22 }} />
        </div>
      </div>

      {/* ── Rayons ── */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label style={S.label}>Rayon découverte (m)</label>
          <input type="number" value={form.rayon_metres}
            onChange={e => setField('rayon_metres', e.target.value)} style={S.field} />
        </div>
        <div className="flex-1">
          <label style={S.label}>Rayon approche (m)</label>
          <input type="number" value={form.rayon_approche_metres}
            onChange={e => setField('rayon_approche_metres', e.target.value)} style={S.field} />
        </div>
      </div>

      {/* ── Texte mission ── */}
      <div className="mb-4">
        <label style={S.label}>Récit pédagogique (texte mission)</label>
        <textarea value={form.texte} onChange={e => setField('texte', e.target.value)}
          rows={4} placeholder="Cet arbre robuste pousse dans les sols calcaires…"
          style={{ ...S.field, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {/* ── Question ── */}
      <div style={{ background: 'rgba(184,134,46,0.06)', border: '1px solid rgba(184,134,46,0.2)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ ...S.title, fontSize: 16, color: '#b8862e', marginBottom: 10 }}>✦ La question</div>

        <div className="mb-3">
          <label style={S.label}>Question</label>
          <input value={form.question} onChange={e => setField('question', e.target.value)}
            placeholder="Quelle est sa particularité ?" style={S.field} />
        </div>

        {form.choix.map((c, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <button onClick={() => setField('bonne_reponse', i)}
              className="cursor-pointer"
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: form.bonne_reponse === i ? '#4a6b3a' : 'transparent',
                border: `1.5px solid ${form.bonne_reponse === i ? '#4a6b3a' : 'rgba(244,236,216,0.25)'}`,
                color: '#f4ecd8', fontSize: 12,
              }}>
              {form.bonne_reponse === i ? '✓' : String.fromCharCode(65 + i)}
            </button>
            <input value={c} onChange={e => setChoix(i, e.target.value)}
              placeholder={`Choix ${String.fromCharCode(65 + i)}`}
              style={{ ...S.field, flex: 1 }} />
          </div>
        ))}

        <div className="mt-3">
          <label style={S.label}>Indice (mauvaise réponse)</label>
          <input value={form.indice} onChange={e => setField('indice', e.target.value)}
            placeholder="Pense à la forme de ses feuilles…" style={S.field} />
        </div>
      </div>

      {/* ── Page narrative ── */}
      <div style={{ background: 'rgba(28,79,76,0.08)', border: '1px solid rgba(28,79,76,0.25)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ ...S.title, fontSize: 16, color: '#1c4f4c', marginBottom: 10 }}>📖 Carnet du naturaliste</div>

        <div className="mb-3">
          <label style={S.label}>Numéro de page</label>
          <input type="number" value={narr.page_number}
            onChange={e => setNarr(n => ({ ...n, page_number: e.target.value }))}
            placeholder="1" style={{ ...S.field, width: 100 }} />
        </div>

        <div className="mb-3">
          <label style={S.label}>Texte manuscrit (Caveat)</label>
          <textarea value={narr.journal_text}
            onChange={e => setNarr(n => ({ ...n, journal_text: e.target.value }))}
            rows={4} placeholder="J'ai croisé aujourd'hui un chêne au tronc tortueux…"
            style={{ ...S.field, resize: 'vertical', lineHeight: 1.6, fontFamily: 'Caveat, cursive', fontSize: 18 }} />
        </div>

        <div>
          <label style={S.label}>URL audio MP3 (optionnel, sinon TTS)</label>
          <input value={narr.audio_url}
            onChange={e => setNarr(n => ({ ...n, audio_url: e.target.value }))}
            placeholder="https://..." style={S.field} />
        </div>
      </div>

      {/* ── Illustration ── */}
      <div className="mb-5" style={{ background: 'rgba(244,236,216,0.03)', border: '1px dashed rgba(244,236,216,0.15)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 11, color: '#8a7e6c', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
          🖼 Illustration attendue : <code style={{ color: '#c9b78a' }}>/public/illustrations/missions/{form.id || '<id>'}.png</code>
          <br />
          <span style={{ color: '#4a4540', fontSize: 10 }}>(à déposer manuellement dans le repo, ou utiliser le champ image_url ci-dessous)</span>
        </div>
        <div className="mt-3">
          <label style={S.label}>image_url (override Supabase Storage)</label>
          <input value={form.image_url} onChange={e => setField('image_url', e.target.value)}
            placeholder="https://..." style={S.field} />
        </div>
      </div>

      {/* ── Save ── */}
      <button onClick={handleSave}
        disabled={saving || !form.id || !form.titre}
        className="w-full cursor-pointer"
        style={{
          height: 54, borderRadius: 14,
          background: saved ? '#4a6b3a' : (!form.id || !form.titre ? 'rgba(184,134,46,0.25)' : '#b8862e'),
          color: saved ? '#f4ecd8' : '#1c1a14',
          border: 'none', ...S.title, fontSize: 22,
          opacity: saving ? 0.7 : 1,
          transition: 'background 0.3s',
        }}>
        {saved ? '✓ Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer la mission →'}
      </button>

      {error && (
        <p style={{ color: '#a14a3c', fontSize: 13, marginTop: 10, fontFamily: 'Inter, sans-serif' }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
