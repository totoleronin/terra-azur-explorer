import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SENTIERS, MISSIONS } from '../data/seeds'

export function useTrails() {
  const [sentiers, setSentiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('sentiers').select('*')
        if (error) throw error
        setSentiers(data && data.length > 0 ? data : SENTIERS)
      } catch (e) {
        console.warn('Supabase non disponible, données locales utilisées', e)
        setSentiers(SENTIERS)
        setError(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { sentiers, loading, error }
}

export function useMissions(sentierId) {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sentierId) return
    async function load() {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('*')
          .eq('sentier_id', sentierId)
        if (error) throw error
        setMissions(data && data.length > 0 ? data : MISSIONS.filter(m => m.sentier_id === sentierId))
      } catch {
        setMissions(MISSIONS.filter(m => m.sentier_id === sentierId))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sentierId])

  return { missions, loading }
}
