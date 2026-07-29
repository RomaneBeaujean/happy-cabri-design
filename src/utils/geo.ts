import type { TrackPoint } from '../pages/RacePlan/trackData'

function toRad(deg: number) { return deg * Math.PI / 180 }

export function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Position lat/lon interpolée le long du tracé pour une distance `km` donnée. */
export function latLngAtKm(track: TrackPoint[], km: number): [number, number] {
  if (km <= track[0].km) return [track[0].lat, track[0].lon]
  const last = track[track.length - 1]
  if (km >= last.km) return [last.lat, last.lon]
  for (let i = 0; i < track.length - 1; i++) {
    const p0 = track[i], p1 = track[i + 1]
    if (km >= p0.km && km <= p1.km) {
      const t = p1.km === p0.km ? 0 : (km - p0.km) / (p1.km - p0.km)
      return [p0.lat + t * (p1.lat - p0.lat), p0.lon + t * (p1.lon - p0.lon)]
    }
  }
  return [last.lat, last.lon]
}

/**
 * Projette un point cliqué (lat/lon) sur le tracé et retourne la distance (km) du point du
 * tracé le plus proche — projection sur chaque segment du polyline, pas juste le point le
 * plus proche, pour rester précis même avec un échantillonnage large entre deux points du tracé.
 */
export function nearestKmOnTrack(track: TrackPoint[], lat: number, lon: number): number {
  let bestKm = track[0].km
  let bestDist = Infinity
  for (let i = 0; i < track.length - 1; i++) {
    const p0 = track[i], p1 = track[i + 1]
    // Projection approximative en repère local (equirectangulaire), suffisante à cette échelle.
    const cosLat = Math.cos(toRad((p0.lat + p1.lat) / 2))
    const x0 = 0, y0 = 0
    const x1 = (p1.lon - p0.lon) * cosLat, y1 = p1.lat - p0.lat
    const xp = (lon - p0.lon) * cosLat, yp = lat - p0.lat
    const segLenSq = x1 * x1 + y1 * y1
    const t = segLenSq > 0 ? Math.max(0, Math.min(1, (xp * x1 + yp * y1) / segLenSq)) : 0
    const projX = x0 + t * (x1 - x0), projY = y0 + t * (y1 - y0)
    const dx = xp - projX, dy = yp - projY
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      bestKm = p0.km + t * (p1.km - p0.km)
    }
  }
  return bestKm
}
