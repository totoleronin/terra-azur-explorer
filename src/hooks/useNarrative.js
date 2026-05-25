import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Trame narrative globale du sentier (nom du naturaliste, intro, fin mystère)
export function useTrailNarrative(trailId) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!trailId) return
    let mounted = true
    supabase
      .from('trail_narrative')
      .select('*')
      .eq('trail_id', trailId)
      .maybeSingle()
      .then(({ data }) => { if (mounted) setData(data) })
    return () => { mounted = false }
  }, [trailId])
  return data
}

// Page de carnet pour une mission donnée
export function useMissionNarrative(missionId) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!missionId) return
    let mounted = true
    supabase
      .from('mission_narrative')
      .select('*')
      .eq('mission_id', missionId)
      .maybeSingle()
      .then(({ data }) => { if (mounted) setData(data) })
    return () => { mounted = false }
  }, [missionId])
  return data
}
