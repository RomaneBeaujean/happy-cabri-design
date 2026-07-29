import type { AltimetryPoint } from '../../components/AltimetryChart'

// Version simplifiée du ClimbDetector de l'app réelle (lissage → pente glissante →
// détection des transitions montée/descente → fusion des segments trop courts).

function altAt(points: AltimetryPoint[], km: number): number {
  if (km <= points[0].km) return points[0].alt
  const last = points[points.length - 1]
  if (km >= last.km) return last.alt
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1]
    if (km >= p0.km && km <= p1.km) {
      const t = p1.km === p0.km ? 0 : (km - p0.km) / (p1.km - p0.km)
      return p0.alt + t * (p1.alt - p0.alt)
    }
  }
  return last.alt
}

function smoothByWindow(points: AltimetryPoint[], windowKm: number): AltimetryPoint[] {
  return points.map(p => {
    const from = p.km - windowKm / 2
    const to = p.km + windowKm / 2
    const inWindow = points.filter(q => q.km >= from && q.km <= to)
    const avg = inWindow.reduce((s, q) => s + q.alt, 0) / inWindow.length
    return { km: p.km, alt: avg }
  })
}

function slidingSlopePct(points: AltimetryPoint[], windowKm: number): { km: number; slope: number }[] {
  const minKm = points[0].km, maxKm = points[points.length - 1].km
  return points.map(p => {
    const from = Math.max(minKm, p.km - windowKm / 2)
    const to = Math.min(maxKm, p.km + windowKm / 2)
    const dist = to - from
    const slope = dist > 0 ? ((altAt(points, to) - altAt(points, from)) / (dist * 1000)) * 100 : 0
    return { km: p.km, slope }
  })
}

type SlopeType = 'up' | 'down' | 'flat'
function classify(slope: number): SlopeType {
  if (slope > 3) return 'up'
  if (slope < -3) return 'down'
  return 'flat'
}

const MIN_SEGMENT_KM = 1.5

/** Propose une liste de distances de séparateurs (km) à partir des montées/descentes détectées sur le profil. */
export function detectClimbSeparators(altData: AltimetryPoint[]): number[] {
  if (altData.length < 3) return []
  const totalKm = altData[altData.length - 1].km
  const smoothed = smoothByWindow(altData, 1)
  const slopes = slidingSlopePct(smoothed, 0.6)

  interface Run { type: SlopeType; from: number; to: number }
  const runs: Run[] = []
  let current: SlopeType = classify(slopes[0].slope)
  let runStart = slopes[0].km
  for (let i = 1; i < slopes.length; i++) {
    const type = classify(slopes[i].slope)
    if (type !== current) {
      runs.push({ type: current, from: runStart, to: slopes[i].km })
      current = type
      runStart = slopes[i].km
    }
  }
  runs.push({ type: current, from: runStart, to: totalKm })

  // Fusionne les segments trop courts avec le voisin le plus pertinent
  const merged = [...runs]
  let changed = true
  while (changed && merged.length > 1) {
    changed = false
    for (let i = 0; i < merged.length; i++) {
      if (merged[i].to - merged[i].from >= MIN_SEGMENT_KM) continue
      const prev = merged[i - 1]
      const next = merged[i + 1]
      if (prev && next) {
        const mergeIntoPrev = prev.type === next.type
          ? true
          : (prev.to - prev.from) >= (next.to - next.from)
        if (mergeIntoPrev) prev.to = merged[i].to
        else next.from = merged[i].from
      } else if (prev) {
        prev.to = merged[i].to
      } else if (next) {
        next.from = merged[i].from
      } else {
        break
      }
      merged.splice(i, 1)
      changed = true
      break
    }
  }

  return merged
    .slice(0, -1)
    .map(r => +r.to.toFixed(1))
    .filter(km => km > 0.1 && km < totalKm - 0.1)
}
