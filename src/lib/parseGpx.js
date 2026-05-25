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
 * Calcule les stats d'élévation d'un tracé.
 */
export function elevationStats(points) {
  const eles = points.map(p => p[2]).filter(e => e > 0)
  if (eles.length === 0) return null
  const min = Math.min(...eles)
  const max = Math.max(...eles)
  return { min, max, delta: max - min }
}
