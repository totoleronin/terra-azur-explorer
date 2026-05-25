import { useState, useEffect } from 'react'

const WEATHER_ICONS = {
  Thunderstorm: '⛈', Drizzle: '🌦', Rain: '🌧',
  Snow: '❄️', Atmosphere: '🌫', Clear: '☀️', Clouds: '⛅',
}

// Hook météo — nécessite VITE_OPENWEATHER_KEY dans .env
// Si la clé est absente, retourne null silencieusement.
export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const key = import.meta.env.VITE_OPENWEATHER_KEY
    if (!key || !lat || !lng) return
    let mounted = true

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`
    )
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const main = d.weather?.[0]?.main || 'Clouds'
        const temp = Math.round(d.main?.temp ?? 20)
        setWeather({ emoji: WEATHER_ICONS[main] || '🌤', temp })
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [lat && Math.round(lat * 100), lng && Math.round(lng * 100)])

  return weather
}
