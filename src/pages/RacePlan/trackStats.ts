import type { AltimetryPoint } from '../../components/AltimetryChart'
import { altAt, computeElevation, type DerivedSegment } from './segmentModel'
import { fmtTime, fmtPassage, paceToSec } from './format'

export interface PointStats {
  km: number
  alt: number
  elapsedMins: number
  elapsedLabel: string
  timeLabel: string
  dp: number
  dm: number
  paceLabel: string
}

interface SegmentBounds {
  from: number
  to: number
  pace: string
  startMins: number
  startDp: number
  startDm: number
}

/**
 * Construit une fonction km -> stats (heure de passage, temps écoulé, D+/D- cumulés, allure),
 * à partir des segments définis par l'utilisateur (une allure moyenne constante par segment).
 */
export function makeStatsAtKm(
  segments: DerivedSegment[],
  altData: AltimetryPoint[],
  raceStartMins: number
): (km: number) => PointStats {
  let cumMins = 0, cumDp = 0, cumDm = 0
  const bounds: SegmentBounds[] = segments.map(seg => {
    const b: SegmentBounds = { from: seg.from, to: seg.to, pace: seg.pace, startMins: cumMins, startDp: cumDp, startDm: cumDm }
    cumMins += seg.timeMins
    cumDp += seg.dp
    cumDm += seg.dm
    return b
  })

  return function statsAtKm(km: number): PointStats {
    if (bounds.length === 0) {
      return {
        km, alt: Math.round(altAt(altData, km)), elapsedMins: 0, elapsedLabel: '0 min',
        timeLabel: fmtPassage(raceStartMins), dp: 0, dm: 0, paceLabel: '—',
      }
    }

    const seg = bounds.find(b => km >= b.from && km <= b.to)
      ?? (km < bounds[0].from ? bounds[0] : bounds[bounds.length - 1])

    const withinKm = Math.max(0, Math.min(km, seg.to) - seg.from)
    const paceMinPerKm = paceToSec(seg.pace) / 60
    const elapsedMins = seg.startMins + withinKm * paceMinPerKm
    const { dp: partialDp, dm: partialDm } = computeElevation(altData, seg.from, Math.min(Math.max(km, seg.from), seg.to))

    return {
      km: Math.round(km * 10) / 10,
      alt: Math.round(altAt(altData, km)),
      elapsedMins,
      elapsedLabel: fmtTime(Math.round(elapsedMins)),
      timeLabel: fmtPassage(Math.round(raceStartMins + elapsedMins)),
      dp: seg.startDp + partialDp,
      dm: seg.startDm + partialDm,
      paceLabel: `${seg.pace}/km`,
    }
  }
}

/** Numérote les points de passage interne en "Ravitaillement N" / "Séparateur N", triés par km. */
export function makePointLabels(
  cutPoints: { id: string; km: number }[],
  ravitoIds: Set<string>
): Map<string, string> {
  const sorted = [...cutPoints].sort((a, b) => a.km - b.km).slice(1, -1)
  const labels = new Map<string, string>()
  let ravitoCount = 0, sepCount = 0
  for (const cp of sorted) {
    if (ravitoIds.has(cp.id)) {
      ravitoCount++
      labels.set(cp.id, `Ravitaillement ${ravitoCount}`)
    } else {
      sepCount++
      labels.set(cp.id, `Séparateur ${sepCount}`)
    }
  }
  return labels
}
