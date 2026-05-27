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

export function useAllMissions() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('missions').select('id, sentier_id')
        if (error) throw error
        setMissions(data && data.length > 0 ? data : MISSIONS)
      } catch {
        setMissions(MISSIONS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  return { missions, loading }
}

export function useMissions(sentierId) {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sentierId) return
    async function load() {
      try {
        const [{ data: mData, error }, { data: nData }] = await Promise.all([
          supabase.from('missions').select('*').eq('sentier_id', sentierId),
          supabase.from('mission_narrative').select('mission_id, page_number'),
        ])
        if (error) throw error
        const pageMap = Object.fromEntries((nData || []).map(n => [n.mission_id, n.page_number]))
        const merged = (mData && mData.length > 0 ? mData : MISSIONS.filter(m => m.sentier_id === sentierId))
          .map(m => ({ ...m, page_number: pageMap[m.id] ?? null }))
          .sort((a, b) => (a.page_number ?? 99) - (b.page_number ?? 99))
        setMissions(merged)
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
