import { useState, useEffect } from 'react'

// Mapping codes météo WMO (Open-Meteo) → emoji
function emojiFromCode(c) {
  if (c == null) return '🌤'
  if (c === 0) return '☀️'
  if (c <= 2) return '🌤'
  if (c === 3) return '⛅'
  if (c === 45 || c === 48) return '🌫'
  if (c >= 51 && c <= 57) return '🌦'
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return '🌧'
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return '❄️'
  if (c >= 95) return '⛈'
  return '🌤'
}

const CACHE_TTL_MS = 30 * 60 * 1000

function cacheKey(lat, lng) {
  return `terra.weather.${lat.toFixed(2)}_${lng.toFixed(2)}`
}

function readCache(lat, lng) {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng))
    if (!raw) return null
    const o = JSON.parse(raw)
    if (Date.now() - o.ts > CACHE_TTL_MS) return null
    return { emoji: o.emoji, temp: o.temp }
  } catch { return null }
}

function writeCache(lat, lng, val) {
  try {
    localStorage.setItem(cacheKey(lat, lng), JSON.stringify({ ...val, ts: Date.now() }))
  } catch {}
}

/**
 * Météo actuelle pour [lat, lng] via Open-Meteo (gratuit, sans clé).
 * Cache localStorage de 30 min pour éviter les appels répétés.
 * Retourne { emoji, temp } ou null tant que la requête n'a pas abouti.
 */
export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(() => {
    if (lat == null || lng == null) return null
    return readCache(lat, lng)
  })

  useEffect(() => {
    if (lat == null || lng == null) return
    const cached = readCache(lat, lng)
    if (cached) { setWeather(cached); return }

    let mounted = true
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const cw = d.current_weather
        if (!cw) return
        const val = {
          emoji: emojiFromCode(cw.weathercode),
          temp: Math.round(cw.temperature),
        }
        setWeather(val)
        writeCache(lat, lng, val)
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [lat && Math.round(lat * 100), lng && Math.round(lng * 100)])

  return weather
}
