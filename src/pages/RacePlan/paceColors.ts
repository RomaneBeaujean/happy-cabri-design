/**
 * Coloration de la courbe d'allure — relative à l'allure de la course (rapide → lente),
 * PAS à la pente du terrain. Portage fidèle de `PaceColors.ts` (happy-cabri-beta), adapté en
 * secondes (le reste de l'app raisonne en secondes via `paceToSec`/`secToPace`).
 */
const PACE_COLORS = [
  '#DC2626', // rouge - très rapide
  '#F87171', // orange foncé
  '#FB923C', // orange clair
  '#10B981', // vert - allure moyenne
  '#60A5FA', // bleu clair
  '#3B82F6', // bleu moyen
  '#1D4ED8', // bleu foncé - très lente
] as const

// Demi-largeur (en secondes) de la bande "verte" autour de l'allure moyenne — équivalent des
// ±0.5 min de la version beta.
const AVG_BAND_SEC = 30

export function getPaceColor(paceSec: number, avgSec: number, minSec: number, maxSec: number): string {
  if (paceSec <= minSec) return PACE_COLORS[0]
  if (paceSec >= maxSec) return PACE_COLORS[6]

  const thresholds = [
    minSec + (avgSec - minSec) / 3,
    minSec + (2 * (avgSec - minSec)) / 3,
    avgSec - AVG_BAND_SEC,
    avgSec + AVG_BAND_SEC,
    avgSec + (maxSec - avgSec) / 3,
    avgSec + (2 * (maxSec - avgSec)) / 3,
  ]

  if (paceSec < thresholds[0]) return PACE_COLORS[0]
  if (paceSec < thresholds[1]) return PACE_COLORS[1]
  if (paceSec < thresholds[2]) return PACE_COLORS[2]
  if (paceSec <= thresholds[3]) return PACE_COLORS[3]
  if (paceSec < thresholds[4]) return PACE_COLORS[4]
  if (paceSec < thresholds[5]) return PACE_COLORS[5]
  return PACE_COLORS[6]
}

/**
 * Points d'arrêt d'un dégradé entre deux allures (palier courant → palier suivant) — le
 * connecteur vertical entre deux paliers de la courbe d'allure doit visuellement traverser
 * TOUTES les couleurs intermédiaires de la palette (pas seulement blend direct entre les deux
 * couleurs des paliers), sinon un grand écart d'allure saute des couleurs (ex: rouge → bleu
 * direct au lieu de rouge → orange → orange → vert → bleu clair → bleu → bleu foncé).
 * offset 0 = allure de départ, offset 1 = allure d'arrivée (peut décroître si l'allure ralentit).
 */
export function getPaceGradientStops(
  startSec: number,
  endSec: number,
  avgSec: number,
  minSec: number,
  maxSec: number
): { offset: number; color: string }[] {
  const lo = Math.min(startSec, endSec)
  const hi = Math.max(startSec, endSec)
  const thresholds = [
    minSec,
    minSec + (avgSec - minSec) / 3,
    minSec + (2 * (avgSec - minSec)) / 3,
    avgSec - AVG_BAND_SEC,
    avgSec + AVG_BAND_SEC,
    avgSec + (maxSec - avgSec) / 3,
    avgSec + (2 * (maxSec - avgSec)) / 3,
    maxSec,
  ]

  const paces = new Set<number>([startSec, endSec])
  for (const t of thresholds) {
    if (t > lo && t < hi) paces.add(t)
  }

  const span = endSec - startSec || 1
  return [...paces]
    .map(pace => ({ offset: (pace - startSec) / span, color: getPaceColor(pace, avgSec, minSec, maxSec) }))
    .sort((a, b) => a.offset - b.offset)
}
