import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AdminLayout from './AdminLayout'

const CATEGORIES = ['Plante', 'Animal', 'Géologie', 'Point de vue']
const EMPTY = {
  id: '', sentier_id: '', titre: '', categorie: 'Plante',
  lat: '', lng: '', rayon_metres: 50,
  texte: '', question: '', choix: ['', '', ''], bonne_reponse: 0, indice: ''
}

export default function MissionsAdmin() {
  const [missions, setMissions] = useState([])
  const [sentiers, setSentiers] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [filterSentier, setFilterSentier] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('missions').select('*').order('sentier_id'),
      supabase.from('sentiers').select('id, nom').order('nom'),
    ])
    setMissions(m || [])
    setSentiers(s || [])
  }

  function flash(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function save(form) {
    setSaving(true)
    const choix = form.choix.filter(c => c.trim() !== '')
    const payload = {
      id: form.id || `${form.sentier_id}-${Date.now()}`,
      sentier_id: form.sentier_id,
      titre: form.titre,
      categorie: form.categorie,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      rayon_metres: parseInt(form.rayon_metres) || 50,
      texte: form.texte,
      question: form.question,
      choix,
      bonne_reponse: parseInt(form.bonne_reponse),
      indice: form.indice,
    }
    const { error } = await supabase.from('missions').upsert(payload)
    setSaving(false)
    if (error) { flash('Erreur : ' + error.message, false); return }
    flash('Mission sauvegardée ✓')
    setEditing(null)
    loadAll()
  }

  async function remove(id) {
    if (!confirm('Supprimer cette mission ?')) return
    const { error } = await supabase.from('missions').delete().eq('id', id)
    if (error) { flash('Erreur : ' + error.message, false); return }
    flash('Mission supprimée')
    loadAll()
  }

  const displayed = filterSentier ? missions.filter(m => m.sentier_id === filterSentier) : missions
  const sentierName = id => sentiers.find(s => s.id === id)?.nom || id

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-adventure text-adventure-brown text-3xl">Missions</h1>
        <div className="flex gap-3 items-center">
          <select value={filterSentier} onChange={e => setFilterSentier(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-adventure-gold">
            <option value="">Tous les sentiers</option>
            {sentiers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <button onClick={() => setEditing({ ...EMPTY, choix: ['', '', ''] })}
            className="bg-adventure-gold text-white font-bold px-4 py-2 rounded-xl hover:bg-adventure-brown transition-colors">
            + Nouvelle mission
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-bold ${msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {!editing && (
        <div className="flex flex-col gap-3">
          {displayed.length === 0 && (
            <p className="text-gray-500 text-center py-8">Aucune mission.</p>
          )}
          {displayed.map(m => (
            <div key={m.id} className="bg-white rounded-2xl shadow p-4 flex items-start gap-4 border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-adventure-brown truncate">{m.titre}</span>
                  <span className="text-xs bg-parchment-200 text-adventure-brown px-2 py-0.5 rounded-full">{m.categorie}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{sentierName(m.sentier_id)}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">📍 {m.lat}, {m.lng} · rayon {m.rayon_metres}m</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">❓ {m.question}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing({ ...m, choix: Array.isArray(m.choix) ? m.choix : JSON.parse(m.choix || '[]') })}
                  className="bg-parchment-200 text-adventure-brown text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-parchment-300 transition-colors">
                  ✏️
                </button>
                <button onClick={() => remove(m.id)}
                  className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MissionForm
          initial={editing}
          sentiers={sentiers}
          saving={saving}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </AdminLayout>
  )
}

function MissionForm({ initial, sentiers, saving, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setChoix = (i, v) => setForm(f => { const c = [...f.choix]; c[i] = v; return { ...f, choix: c } })

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
      <h2 className="font-adventure text-adventure-brown text-2xl mb-5">
        {initial.id ? 'Modifier la mission' : 'Nouvelle mission'}
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {/* Sentier + catégorie */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Sentier *</label>
            <select value={form.sentier_id} onChange={e => set('sentier_id', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-adventure-gold">
              <option value="">— Choisir —</option>
              {sentiers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Catégorie</label>
            <select value={form.categorie} onChange={e => set('categorie', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-adventure-gold">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <Field label="Titre de la mission *" value={form.titre} onChange={v => set('titre', v)} placeholder="Ex: Le Chêne-liège" />

        {/* GPS */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-bold text-blue-700 mb-3">📍 Point GPS de déclenchement</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Latitude *" value={form.lat} onChange={v => set('lat', v)} placeholder="43.5170" type="number" />
            <Field label="Longitude *" value={form.lng} onChange={v => set('lng', v)} placeholder="6.8840" type="number" />
            <Field label="Rayon (mètres)" value={form.rayon_metres} onChange={v => set('rayon_metres', v)} placeholder="50" type="number" />
          </div>
        </div>

        <Field label="Texte de découverte (pour les enfants)" value={form.texte} onChange={v => set('texte', v)} multiline
          placeholder="2-3 phrases, ton ludique pour les 6-12 ans…" />

        {/* QCM */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-sm font-bold text-amber-700 mb-3">🧠 Question QCM</p>
          <Field label="Question" value={form.question} onChange={v => set('question', v)} placeholder="Ex: À quoi sert l'écorce du chêne-liège ?" />
          <div className="mt-3 flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set('bonne_reponse', i)}
                  className={`w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 border-2 transition-colors ${
                    form.bonne_reponse === i
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-green-400'
                  }`}
                  title="Cocher comme bonne réponse"
                >
                  {['A', 'B', 'C'][i]}
                </button>
                <input
                  type="text"
                  value={form.choix[i] || ''}
                  onChange={e => setChoix(i, e.target.value)}
                  placeholder={`Réponse ${['A', 'B', 'C'][i]}`}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-adventure-gold"
                />
              </div>
            ))}
            <p className="text-xs text-amber-600 mt-1">Clique sur la lettre verte pour marquer la bonne réponse.</p>
          </div>
        </div>

        <Field label="Indice (si mauvaise réponse)" value={form.indice} onChange={v => set('indice', v)}
          placeholder="Ex: Pense aux bouteilles de vin…" />
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => onSave(form)}
          disabled={saving || !form.titre || !form.sentier_id || !form.lat || !form.lng}
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
