/**
 * Coloration par pente du terrain — bandes partagées entre le profil (remplissage sous la
 * courbe) et la carte (trait du parcours), pour que les deux vues restent cohérentes.
 */
export const SLOPE_BANDS = [
  { max: 5,        color: '#6AAF7E', label: '<5%'    },
  { max: 10,       color: '#EEC040', label: '5–10%'  },
  { max: 15,       color: '#F08030', label: '10–15%' },
  { max: 20,       color: '#D03030', label: '15–20%' },
  { max: 25,       color: '#7A1010', label: '20–25%' },
  { max: Infinity, color: '#2B0505', label: '>25%'   },
] as const

export function getSlopeColor(slopePct: number): string {
  const abs = Math.abs(slopePct)
  return SLOPE_BANDS.find(b => abs < b.max)?.color ?? '#2B0505'
}

/** Couleurs des marqueurs de point de passage — alignées sur les étiquettes km du profil.
 * Séparateur : couleur primary (noir) partout — étiquette, point, pointillé. */
export const WAYPOINT_COLOR = 'var(--color-primary-500)'
export const RAVITO_COLOR = '#C026D3'
