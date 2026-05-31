import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SENTIERS, MISSIONS } from '../data/seeds'

/**
 * Charge les carnets d'exploration : un carnet par sentier, agrégeant le
 * naturaliste, ses pages (missions + texte manuscrit) et l'état d'avancement
 * de l'explorateur (basé sur `collected` + horodatage `collectedAt`).
 *
 * Retourne { carnets, loading } où chaque carnet vaut :
 *   {
 *     trail,                                   // ligne sentier
 *     naturalist: { name, period, intro, ending } | null,
 *     pages: [{ mission, narrative, unlocked }] // triées par page_number
 *     total, completedCount,
 *     status: 'complete' | 'en-cours' | 'a-decouvrir',
 *     lastUpdate: ISOString | null,
 *   }
 */
export function useCarnets(collected = [], collectedAt = {}) {
  const [raw, setRaw] = useState(null) // { trails, missions, missionNarr, trailNarr }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [tr, mi, mn, tn] = await Promise.all([
          supabase.from('sentiers').select('*'),
          supabase.from('missions').select('*'),
          supabase.from('mission_narrative').select('*'),
          supabase.from('trail_narrative').select('*'),
        ])
        if (!mounted) return
        setRaw({
          trails: tr.data && tr.data.length ? tr.data : SENTIERS,
          missions: mi.data && mi.data.length ? mi.data : MISSIONS,
          missionNarr: mn.data || [],
          trailNarr: tn.data || [],
        })
      } catch {
        if (!mounted) return
        setRaw({ trails: SENTIERS, missions: MISSIONS, missionNarr: [], trailNarr: [] })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const carnets = raw ? buildCarnets(raw, collected, collectedAt) : []
  return { carnets, loading }
}

function buildCarnets({ trails, missions, missionNarr, trailNarr }, collected, collectedAt) {
  const narrByMission = Object.fromEntries(missionNarr.map(n => [n.mission_id, n]))
  const narrByTrail = Object.fromEntries(trailNarr.map(n => [n.trail_id, n]))

  return trails.map(trail => {
    const tn = narrByTrail[trail.id]
    const trailMissions = missions
      .filter(m => m.sentier_id === trail.id)
      .map(m => {
        const narrative = narrByMission[m.id] || null
        return { mission: m, narrative, unlocked: collected.includes(m.id) }
      })
      .sort((a, b) => {
        const pa = a.narrative?.page_number ?? 99
        const pb = b.narrative?.page_number ?? 99
        return pa - pb
      })

    const total = trailMissions.length
    const completedCount = trailMissions.filter(p => p.unlocked).length
    const status = completedCount === 0
      ? 'a-decouvrir'
      : completedCount >= total && total > 0
      ? 'complete'
      : 'en-cours'

    // Date de dernière mise à jour = horodatage le plus récent parmi les missions débloquées
    let lastUpdate = null
    for (const p of trailMissions) {
      const ts = collectedAt[p.mission.id]
      if (ts && (!lastUpdate || ts > lastUpdate)) lastUpdate = ts
    }

    return {
      trail,
      naturalist: tn
        ? {
            name: tn.naturalist_name,
            period: tn.naturalist_period,
            intro: tn.intro_text,
            ending: tn.mystery_ending,
          }
        : null,
      pages: trailMissions,
      total,
      completedCount,
      status,
      lastUpdate,
    }
  })
}
