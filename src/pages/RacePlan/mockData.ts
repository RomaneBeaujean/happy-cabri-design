import { makeId, type CutPoint, type SegmentData, type SegmentNutrition } from './segmentModel'

export { ALT_DATA, ROUTE_LATLNG, TRACK, type TrackPoint } from './trackData'

// ── Produits du coureur ────────────────────────────────────────────────────────
export interface RunnerProduct { label: string; category: string; waterMl?: number }

export const RUNNER_PRODUCTS: RunnerProduct[] = [
  { label: 'Gommes Ta',      category: 'Barre' },
  { label: "Pom Pot'",       category: 'Compote' },
  { label: 'Baouw Pistache', category: 'Barre' },
  { label: 'Ta Energy Gel',  category: 'Gel' },
  { label: 'Maurtem',        category: 'Gel' },
  { label: 'Goji',           category: 'Barre' },
  { label: 'Pâte de fruit',  category: 'Gel' },
]

// ── Segments initiaux — dérivés des splits/séparateurs réels "Luchon Aneto Trail 2025" ──
const SEGMENT_SEED: { to: number; pace: string; timeMins: number; nutrition?: SegmentNutrition }[] = [
  { to: 1.6,  pace: '13:08', timeMins: 21,  nutrition: { items: [{ qty: 2, label: 'Gommes Ta' }] } },
  { to: 4.2,  pace: '8:27',  timeMins: 22,  nutrition: { items: [{ qty: 1, label: "Pom Pot'" }, { qty: 1, label: 'Gommes Ta' }] } },
  { to: 13,   pace: '13:04', timeMins: 115, nutrition: { items: [{ qty: 0.5, label: 'Baouw Pistache' }, { qty: 2, label: 'Gommes Ta' }, { qty: 1, label: 'Ta Energy Gel' }, { qty: 1, label: "Pom Pot'" }] } },
  { to: 14.7, pace: '6:23',  timeMins: 11,  nutrition: { items: [{ qty: 1, label: 'Gommes Ta' }] } },
  { to: 20.5, pace: '20:00', timeMins: 116, nutrition: { items: [{ qty: 1, label: 'Maurtem' }, { qty: 1, label: 'Goji' }, { qty: 0.5, label: 'Baouw Pistache' }, { qty: 1, label: 'Gommes Ta' }, { qty: 0.5, label: 'Ta Energy Gel' }] } },
  { to: 22,   pace: '6:30',  timeMins: 10,  nutrition: { items: [{ qty: 1, label: 'Gommes Ta' }] } },
  { to: 23.3, pace: '23:05', timeMins: 30,  nutrition: { items: [{ qty: 1, label: 'Pâte de fruit' }] } },
  { to: 29.9, pace: '6:25',  timeMins: 42,  nutrition: { items: [{ qty: 1, label: 'Ta Energy Gel' }] } },
  { to: 32.3, pace: '10:50', timeMins: 26,  nutrition: { items: [{ qty: 2, label: 'Gommes Ta' }] } },
  { to: 40.1, pace: '6:27',  timeMins: 50,  nutrition: { items: [{ qty: 1, label: 'Pâte de fruit' }, { qty: 1, label: 'Maurtem' }] } },
  { to: 43.3, pace: '9:35',  timeMins: 31,  nutrition: { items: [{ qty: 1, label: 'Gommes Ta' }, { qty: 1, label: "Pom Pot'" }] } },
  { to: 54.6, pace: '12:29', timeMins: 141, nutrition: { items: [{ qty: 1, label: 'Baouw Pistache' }, { qty: 1, label: 'Ta Energy Gel' }, { qty: 1, label: 'Pâte de fruit' }, { qty: 3, label: 'Gommes Ta' }] } },
  { to: 58.8, pace: '11:26', timeMins: 48,  nutrition: { items: [{ qty: 1, label: 'Goji' }, { qty: 1, label: "Pom Pot'" }] } },
  { to: 64.2, pace: '19:38', timeMins: 106, nutrition: { items: [{ qty: 1, label: 'Ta Energy Gel' }, { qty: 1, label: 'Gommes Ta' }, { qty: 1, label: 'Pâte de fruit' }, { qty: 0.5, label: 'Baouw Pistache' }] } },
  { to: 68.4, pace: '17:37', timeMins: 74,  nutrition: { items: [{ qty: 1, label: 'Maurtem' }, { qty: 1, label: 'Pâte de fruit' }] } },
  { to: 71.2, pace: '7:30',  timeMins: 21,  nutrition: { items: [{ qty: 1, label: "Pom Pot'" }, { qty: 1, label: 'Gommes Ta' }] } },
  { to: 73,   pace: '13:12', timeMins: 24,  nutrition: { items: [{ qty: 0.5, label: 'Baouw Pistache' }, { qty: 1, label: 'Gommes Ta' }] } },
  { to: 74.3, pace: '7:26',  timeMins: 10,  nutrition: { items: [{ qty: 1, label: 'Gommes Ta' }] } },
  { to: 83.8, pace: '7:28',  timeMins: 71,  nutrition: { items: [{ qty: 1, label: 'Ta Energy Gel' }, { qty: 1, label: 'Pâte de fruit' }] } },
]

// Ravitaillements (arrêt en minutes) et barrières horaires — mêmes distances que les séparateurs réels
const RAVITO_STOPS: Record<number, string> = {
  14.7: '3', 29.9: '5', 43.3: '20', 58.8: '5', 64.2: '5', 74.3: '5',
}
const CUTOFF_TIMES: Record<number, string> = {
  14.7: '07:00', 29.9: '11:00', 43.3: '13:30', 58.8: '16:00', 64.2: '18:00',
}

export function buildInitialData() {
  const boundaryKms = [0, ...SEGMENT_SEED.map(s => s.to)]
  const cutPoints: CutPoint[] = boundaryKms.map(km => ({ id: makeId('cut'), km }))

  const segmentData: Record<string, SegmentData> = {}
  const ravitoIds = new Set<string>()
  const ravitoStops: Record<string, string> = {}
  const cutoffTimes: Record<string, string> = {}

  cutPoints.slice(1).forEach((cp, i) => {
    const seed = SEGMENT_SEED[i]
    segmentData[cp.id] = { pace: seed.pace, timeMins: seed.timeMins, nutrition: seed.nutrition }
    if (cp.km in RAVITO_STOPS) {
      ravitoIds.add(cp.id)
      ravitoStops[cp.id] = RAVITO_STOPS[cp.km]
    }
    if (cp.km in CUTOFF_TIMES) {
      cutoffTimes[cp.id] = CUTOFF_TIMES[cp.km]
    }
  })

  return { cutPoints, segmentData, ravitoIds, ravitoStops, cutoffTimes }
}
