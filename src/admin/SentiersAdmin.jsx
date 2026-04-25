import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AdminLayout from './AdminLayout'

const EMPTY = { id: '', nom: '', description: '', lat_depart: '', lng_depart: '', difficulte: 'Facile', duree: '', distance_km: '' }

export default function SentiersAdmin() {
  const [sentiers, setSentiers] = useState([])
  const [editing, setEditing] = useState(null)   // null | 'new' | sentier object
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('sentiers').select('*').order('nom')
    setSentiers(data || [])
  }

  function flash(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function save(form) {
    setSaving(true)
    const payload = {
      id: form.id || form.nom.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      nom: form.nom,
      description: form.description,
      lat_depart: parseFloat(form.lat_depart),
      lng_depart: parseFloat(form.lng_depart),
      difficulte: form.difficulte,
      duree: form.duree,
      distance_km: parseFloat(form.distance_km) || null,
    }
    const { error } = await supabase.from('sentiers').upsert(payload)
    setSaving(false)
    if (error) { flash('Erreur : ' + error.message, false); return }
    flash('Sentier sauvegardé ✓')
    setEditing(null)
    load()
  }

  async function remove(id) {
    if (!confirm('Supprimer ce sentier et toutes ses missions ?')) return
    const { error } = await supabase.from('sentiers').delete().eq('id', id)
    if (error) { flash('Erreur : ' + error.message, false); return }
    flash('Sentier supprimé')
    load()
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-adventure text-adventure-brown text-3xl">Sentiers</h1>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="bg-adventure-gold text-white font-bold px-4 py-2 rounded-xl hover:bg-adventure-brown transition-colors">
          + Nouveau sentier
        </button>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-bold ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Liste */}
      {!editing && (
        <div className="flex flex-col gap-3">
          {sentiers.length === 0 && (
            <p className="text-gray-500 text-center py-8">Aucun sentier. Clique sur "+ Nouveau sentier".</p>
          )}
          {sentiers.map(s => (
            <div key={s.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 border border-gray-200">
              <div className="flex-1">
                <p className="font-bold text-adventure-brown">{s.nom}</p>
                <p className="text-sm text-gray-500">{s.difficulte} · {s.duree} · {s.distance_km} km</p>
                <p className="text-xs text-gray-400 font-mono mt-1">📍 {s.lat_depart}, {s.lng_depart}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(s)}
                  className="bg-parchment-200 text-adventure-brown text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-parchment-300 transition-colors">
                  ✏️ Modifier
                </button>
                <button onClick={() => remove(s.id)}
                  className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire */}
      {editing && (
        <SentierForm
          initial={editing}
          saving={saving}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </AdminLayout>
  )
}

function SentierForm({ initial, saving, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
      <h2 className="font-adventure text-adventure-brown text-2xl mb-5">
        {initial.id ? 'Modifier le sentier' : 'Nouveau sentier'}
      </h2>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Nom du sentier *" value={form.nom} onChange={v => set('nom', v)} placeholder="Ex: Mont Vinaigre — Estérel" />
        <Field label="Description" value={form.description} onChange={v => set('description', v)} multiline />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude départ *" value={form.lat_depart} onChange={v => set('lat_depart', v)} placeholder="43.5167" type="number" />
          <Field label="Longitude départ *" value={form.lng_depart} onChange={v => set('lng_depart', v)} placeholder="6.8833" type="number" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Difficulté</label>
            <select value={form.difficulte} onChange={e => set('difficulte', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-adventure-gold">
              <option>Facile</option>
              <option>Moyen</option>
              <option>Difficile</option>
            </select>
          </div>
          <Field label="Durée" value={form.duree} onChange={v => set('duree', v)} placeholder="2h" />
          <Field label="Distance (km)" value={form.distance_km} onChange={v => set('distance_km', v)} placeholder="5" type="number" />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => onSave(form)} disabled={saving || !form.nom || !form.lat_depart || !form.lng_depart}
          className="bg-adventure-gold text-white font-bold px-6 py-2.5 rounded-xl hover:bg-adventure-brown transition-colors disabled:opacity-40">
          {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="bg-gray-100 text-gray-600 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline }) {
  const cls = "w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-adventure-gold text-sm"
  return (
    <div>
      <label className="block text-sm font-bold text-gray-600 mb-1">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="any" className={cls} />
      }
    </div>
  )
}
