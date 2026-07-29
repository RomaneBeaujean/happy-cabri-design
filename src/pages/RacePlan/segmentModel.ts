import type { AltimetryPoint } from '../../components/AltimetryChart'

export interface CutPoint { id: string; km: number }

export interface NutritionItem { qty: number; label: string }
export interface SegmentNutrition { water?: number; items?: NutritionItem[] }
export interface SegmentData { pace: string; timeMins: number; nutrition?: SegmentNutrition }

export interface DerivedSegment {
  id: string
  from: number
  to: number
  dp: number
  dm: number
  pace: string
  timeMins: number
  nutrition?: SegmentNutrition
}

const MIN_GAP_KM = 0.1

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function altAt(altData: AltimetryPoint[], km: number): number {
  if (km <= altData[0].km) return altData[0].alt
  const last = altData[altData.length - 1]
  if (km >= last.km) return last.alt
  for (let i = 0; i < altData.length - 1; i++) {
    const p0 = altData[i], p1 = altData[i + 1]
    if (km >= p0.km && km <= p1.km) {
      const t = p1.km === p0.km ? 0 : (km - p0.km) / (p1.km - p0.km)
      return p0.alt + t * (p1.alt - p0.alt)
    }
  }
  return last.alt
}

/** Dénivelé positif/négatif entre deux km, dérivé du profil altimétrique (jamais stocké). */
export function computeElevation(altData: AltimetryPoint[], from: number, to: number): { dp: number; dm: number } {
  const points: AltimetryPoint[] = [{ km: from, alt: altAt(altData, from) }]
  for (const p of altData) if (p.km > from && p.km < to) points.push(p)
  points.push({ km: to, alt: altAt(altData, to) })
  let dp = 0, dm = 0
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].alt - points[i - 1].alt
    if (delta > 0) dp += delta
    else dm += -delta
  }
  return { dp: Math.round(dp), dm: Math.round(dm) }
}

export function mergeNutritionItems(a: NutritionItem[], b: NutritionItem[]): NutritionItem[] {
  const result: NutritionItem[] = a.map(i => ({ ...i }))
  for (const item of b) {
    const existing = result.find(r => r.label === item.label)
    if (existing) existing.qty += item.qty
    else result.push({ ...item })
  }
  return result
}

export function mergeNutrition(a?: SegmentNutrition, b?: SegmentNutrition): SegmentNutrition | undefined {
  if (!a && !b) return undefined
  const water = (a?.water ?? 0) + (b?.water ?? 0) || undefined
  const items = mergeNutritionItems(a?.items ?? [], b?.items ?? [])
  return items.length ? { water, items } : { water }
}

/** Reconstruit la liste des segments (from/to/dp/dm dérivés) à partir des points de coupure + données mutables. */
export function deriveSegments(
  cutPoints: CutPoint[],
  segmentData: Record<string, SegmentData>,
  altData: AltimetryPoint[]
): DerivedSegment[] {
  const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
  const segments: DerivedSegment[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i], to = sorted[i + 1]
    const data = segmentData[to.id]
    const { dp, dm } = computeElevation(altData, from.km, to.km)
    segments.push({
      id: to.id,
      from: from.km,
      to: to.km,
      dp, dm,
      pace: data?.pace ?? '10:00',
      timeMins: data?.timeMins ?? 10,
      nutrition: data?.nutrition,
    })
  }
  return segments
}

/** Insère un nouveau point de coupure à `km` (clampé pour rester entre ses voisins), en scindant proportionnellement le segment existant. */
export function insertCutPoint(
  cutPoints: CutPoint[],
  segmentData: Record<string, SegmentData>,
  km: number
): { cutPoints: CutPoint[]; segmentData: Record<string, SegmentData>; newId: string } {
  const sorted = [...cutPoints].sort((a, b) => a.km - b.km)

  let clamped = km
  let enclosingFrom: CutPoint | undefined
  let enclosingTo: CutPoint | undefined
  for (let i = 0; i < sorted.length - 1; i++) {
    if (km > sorted[i].km && km < sorted[i + 1].km) {
      enclosingFrom = sorted[i]
      enclosingTo = sorted[i + 1]
      clamped = Math.min(Math.max(km, sorted[i].km + MIN_GAP_KM), sorted[i + 1].km - MIN_GAP_KM)
      break
    }
  }

  const newId = makeId('cut')
  const newCutPoints = [...cutPoints, { id: newId, km: clamped }].sort((a, b) => a.km - b.km)
  const newSegmentData = { ...segmentData }
  const oldData = enclosingTo ? segmentData[enclosingTo.id] : undefined

  if (oldData && enclosingFrom && enclosingTo) {
    const totalDist = enclosingTo.km - enclosingFrom.km
    const firstDist = clamped - enclosingFrom.km
    const ratio = totalDist > 0 ? firstDist / totalDist : 0.5
    const firstTime = Math.max(1, Math.round(oldData.timeMins * ratio))
    const secondTime = Math.max(1, oldData.timeMins - firstTime)
    newSegmentData[newId] = { pace: oldData.pace, timeMins: firstTime }
    newSegmentData[enclosingTo.id] = { pace: oldData.pace, timeMins: secondTime, nutrition: oldData.nutrition }
  } else {
    newSegmentData[newId] = { pace: '10:00', timeMins: 10 }
  }

  return { cutPoints: newCutPoints, segmentData: newSegmentData, newId }
}

/** Supprime un point de coupure (fusionne les deux segments adjacents). Refuse de retirer les bornes 0/max. */
export function removeCutPoint(
  cutPoints: CutPoint[],
  segmentData: Record<string, SegmentData>,
  id: string
): { cutPoints: CutPoint[]; segmentData: Record<string, SegmentData> } {
  const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
  const idx = sorted.findIndex(c => c.id === id)
  if (idx <= 0 || idx >= sorted.length - 1) return { cutPoints, segmentData }

  const removed = sorted[idx]
  const survivor = sorted[idx + 1]
  const removedData = segmentData[removed.id]
  const survivorData = segmentData[survivor.id]

  const newSegmentData = { ...segmentData }
  delete newSegmentData[removed.id]
  if (removedData && survivorData) {
    newSegmentData[survivor.id] = {
      timeMins: removedData.timeMins + survivorData.timeMins,
      pace: survivorData.pace,
      nutrition: mergeNutrition(removedData.nutrition, survivorData.nutrition),
    }
  }
  return { cutPoints: cutPoints.filter(c => c.id !== id), segmentData: newSegmentData }
}

/** Déplace un point de coupure existant, clampé strictement entre ses voisins immédiats. */
export function moveCutPoint(cutPoints: CutPoint[], id: string, newKm: number): CutPoint[] {
  const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
  const idx = sorted.findIndex(c => c.id === id)
  if (idx === -1) return cutPoints
  const prev = sorted[idx - 1]
  const next = sorted[idx + 1]
  let clamped = newKm
  if (prev) clamped = Math.max(clamped, prev.km + MIN_GAP_KM)
  if (next) clamped = Math.min(clamped, next.km - MIN_GAP_KM)
  return cutPoints.map(c => c.id === id ? { ...c, km: clamped } : c)
}

/**
 * Reconstruit la liste des points de coupure à partir d'une nouvelle liste de km (0 et le total inclus).
 * Les points dont le km est proche (±0.05km) d'un point existant conservent leur id (et donc leurs
 * données/ravito/barrière horaire) ; les autres sont créés avec des données par défaut.
 */
export function rebuildCutPoints(
  oldCutPoints: CutPoint[],
  oldSegmentData: Record<string, SegmentData>,
  newKms: number[]
): { cutPoints: CutPoint[]; segmentData: Record<string, SegmentData> } {
  const MATCH_EPS = 0.05
  const sortedKms = [...new Set(newKms)].sort((a, b) => a - b)
  const cutPoints: CutPoint[] = sortedKms.map(km => {
    const existing = oldCutPoints.find(c => Math.abs(c.km - km) < MATCH_EPS)
    return existing ? { id: existing.id, km } : { id: makeId('cut'), km }
  })

  const segmentData: Record<string, SegmentData> = {}
  for (let i = 1; i < cutPoints.length; i++) {
    const cp = cutPoints[i]
    if (oldSegmentData[cp.id]) {
      segmentData[cp.id] = oldSegmentData[cp.id]
      continue
    }
    const dist = cutPoints[i].km - cutPoints[i - 1].km
    const timeMins = Math.max(1, Math.round(dist * 8))
    segmentData[cp.id] = { pace: '8:00', timeMins }
  }
  return { cutPoints, segmentData }
}

/** Filtre un dictionnaire pour ne garder que les clés présentes dans `ids`. */
export function pruneRecordByIds<T>(record: Record<string, T>, ids: Set<string>): Record<string, T> {
  const next: Record<string, T> = {}
  for (const [id, val] of Object.entries(record)) {
    if (ids.has(id)) next[id] = val
  }
  return next
}
