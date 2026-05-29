/**
 * Parse un texte GPX (XML) côté navigateur.
 * Retourne un tableau [[lat, lng, ele_m], ...]
 */
export function parseGpxText(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  const trkpts = doc.querySelectorAll('trkpt')
  const points = []
  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'))
    const lon = parseFloat(pt.getAttribute('lon'))
    const eleEl = pt.querySelector('ele')
    const ele = eleEl ? Math.round(parseFloat(eleEl.textContent)) : 0
    if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon, ele])
  })
  return points
}

/**
 * Parse complet d'un GPX : tracé + nom + waypoints.
 * Retourne { points, name, waypoints }
 *  - points    : [[lat, lng, ele], ...] (tracé complet, non simplifié)
 *  - name      : string|null (depuis <trk><name>, <metadata><name> ou <gpx><name>)
 *  - waypoints : [{ lat, lng, ele, name, desc }]
 */
export function parseGpxFull(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  // Tracé
  const points = []
  doc.querySelectorAll('trkpt').forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'))
    const lon = parseFloat(pt.getAttribute('lon'))
    const eleEl = pt.querySelector('ele')
    const ele = eleEl ? Math.round(parseFloat(eleEl.textContent)) : 0
    if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon, ele])
  })

  // Nom : priorité trk > metadata > gpx
  function firstNameIn(selector) {
    const el = doc.querySelector(selector)
    return el && el.textContent.trim() ? el.textContent.trim() : null
  }
  const name =
    firstNameIn('trk > name') ||
    firstNameIn('metadata > name') ||
    firstNameIn('gpx > name') ||
    null

  // Waypoints
  const waypoints = []
  doc.querySelectorAll('wpt').forEach(wpt => {
    const lat = parseFloat(wpt.getAttribute('lat'))
    const lon = parseFloat(wpt.getAttribute('lon'))
    if (isNaN(lat) || isNaN(lon)) return
    const eleEl = wpt.querySelector('ele')
    const nameEl = wpt.querySelector('name')
    const descEl = wpt.querySelector('desc') || wpt.querySelector('cmt')
    waypoints.push({
      lat, lng: lon,
      ele: eleEl ? Math.round(parseFloat(eleEl.textContent)) : 0,
      name: nameEl ? nameEl.textContent.trim() : '',
      desc: descEl ? descEl.textContent.trim() : '',
    })
  })

  return { points, name, waypoints }
}

/**
 * Simplifie un tracé à `target` points en gardant le premier et le dernier.
 */
export function simplifyTrack(points, target = 80) {
  if (points.length <= target) return points
  const step = (points.length - 1) / (target - 1)
  const out = Array.from({ length: target }, (_, i) => points[Math.round(i * step)])
  out[out.length - 1] = points[points.length - 1]
  return out
}

/**
 * Calcule les stats d'élévation d'un tracé (min / max / amplitude).
 */
export function elevationStats(points) {
  const eles = points.map(p => p[2]).filter(e => e > 0)
  if (eles.length === 0) return null
  const min = Math.min(...eles)
  const max = Math.max(...eles)
  return { min, max, delta: max - min }
}

/**
 * Distance haversine entre deux points (mètres).
 */
export function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Statistiques complètes d'un tracé.
 *  - distance_km : longueur totale (somme des segments haversine)
 *  - denivele_pos / denivele_neg : cumul des montées / descentes (seuil 3m anti-bruit)
 *  - alt_min / alt_max : altitudes extrêmes
 * Calcule sur le tracé COMPLET (avant simplification) pour la précision.
 */
export function trackStats(points) {
  if (!points || points.length < 2) return null
  let distM = 0
  let gain = 0
  let loss = 0
  const eles = []
  let lastEle = points[0][2] > 0 ? points[0][2] : null

  for (let i = 1; i < points.length; i++) {
    const [la1, ln1] = points[i - 1]
    const [la2, ln2, e2] = points[i]
    distM += haversineMetres(la1, ln1, la2, ln2)
    if (e2 > 0) {
      eles.push(e2)
      if (lastEle != null) {
        const diff = e2 - lastEle
        if (diff >= 3) { gain += diff; lastEle = e2 }
        else if (diff <= -3) { loss += -diff; lastEle = e2 }
      } else {
        lastEle = e2
      }
    }
  }
  if (points[0][2] > 0) eles.push(points[0][2])

  const alt_min = eles.length ? Math.min(...eles) : null
  const alt_max = eles.length ? Math.max(...eles) : null

  return {
    distance_km: Math.round((distM / 1000) * 10) / 10,
    denivele_pos: Math.round(gain),
    denivele_neg: Math.round(loss),
    alt_min,
    alt_max,
  }
}

/**
 * Durée estimée selon la formule de Naismith :
 * 12 min/km + 10 min par 100m de dénivelé positif.
 * Retourne le nombre de minutes (arrondi).
 */
export function naismithMinutes(distanceKm, gainM = 0) {
  const mins = (distanceKm || 0) * 12 + ((gainM || 0) / 100) * 10
  return Math.round(mins)
}

/**
 * Formate une durée en minutes vers "2h15" ou "45 min".
 */
export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return ''
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}
