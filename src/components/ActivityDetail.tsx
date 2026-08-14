import type { ComponentType, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Bike, Dumbbell, Trophy, X, Zap, Gauge, TrendingDown, TrendingUp, Mountain } from 'lucide-react'
import Runner from './icons/Runner'
import { initAllures, allureParams } from '../pages/RunnerProfile'
import { getPaceColor, getPaceGradientStops } from '../pages/RacePlan/paceColors'
import { secToPace } from '../pages/RacePlan/format'
import { useIsMobile } from '../hooks/useIsMobile'

export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number; style?: CSSProperties }>

export type SportFilter = 'run' | 'bike' | 'strength'
export type SessionType = SportFilter | 'race'

/** Icône de séance — tags dans la grille du calendrier, listes de séances, badge dans la modale de détail. */
export const TYPE_BADGE: Record<SessionType, { icon: IconComponent; bg: string; text: string }> = {
  run:      { icon: Runner,   bg: 'bg-primary-500', text: 'text-neutral-0' },
  bike:     { icon: Bike,     bg: 'bg-primary-500', text: 'text-neutral-0' },
  strength: { icon: Dumbbell, bg: 'bg-primary-500', text: 'text-neutral-0' },
  race:     { icon: Trophy,   bg: 'bg-primary-500', text: 'text-neutral-0' },
}

export interface DaySession {
  id: string
  type: SessionType
  label: string
  distanceKm?: number
  durationMin?: number
  elevation?: number
  location?: string
  /** Uniquement pour les séances de type `race` — id du plan de course associé, pour la navigation. */
  planId?: number
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Clic sur une séance — ouvre le plan de course pour une course liée, sinon la modale de détail. */
export function openSession(s: DaySession, onOpenActivity: (s: DaySession) => void) {
  if (s.type === 'race' && s.planId != null) {
    navigateTo(`/plans/${s.planId}`)
  } else {
    onOpenActivity(s)
  }
}

/** Catégorie de distance — mêmes seuils que le tableau d'allures du profil coureur. */
function distanceCategory(km: number): 'courte' | 'longue' | 'ultra' {
  if (km < 25) return 'courte'
  if (km <= 60) return 'longue'
  return 'ultra'
}

interface ProfilePoint { km: number; alt: number; paceSec: number }

/** Profil altimétrique + allure synthétique, dérivé de manière déterministe des stats de la séance. */
function buildActivityProfile(session: DaySession): ProfilePoint[] {
  const distance = session.distanceKm ?? 0
  const totalElevation = session.elevation ?? 0
  const totalDurationSec = (session.durationMin ?? 0) * 60
  const avgPaceSec = distance > 0 ? totalDurationSec / distance : 0
  if (distance <= 0) return []

  let seed = [...session.id].reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

  const N = Math.max(8, Math.min(20, Math.round(distance)))
  const points: ProfilePoint[] = []
  let alt = 250

  for (let i = 0; i <= N; i++) {
    const t = i / N
    const wave = Math.sin(t * Math.PI * 3 + seed) * 0.5 + (rand() - 0.5) * 0.3
    const deltaAlt = i === 0 ? 0 : wave * (totalElevation / N) * 1.4
    alt = Math.max(150, alt + deltaAlt)
    const paceSec = avgPaceSec > 0
      ? Math.round(avgPaceSec * (1 + Math.max(-0.3, Math.min(0.5, deltaAlt / 40))))
      : 0
    points.push({ km: Math.round((distance * t) * 10) / 10, alt: Math.round(alt), paceSec })
  }
  return points
}

/** Allure moyenne d'une séance, formatée (km/h pour le vélo, /km sinon) — null si non calculable. */
export function formatAvgPace(session: DaySession): string | null {
  if (!session.distanceKm || !session.durationMin) return null
  const avgPaceSec = Math.round((session.durationMin * 60) / session.distanceKm)
  return session.type === 'bike'
    ? `${(3600 / avgPaceSec).toFixed(1)} km/h`
    : `${secToPace(avgPaceSec)} /km`
}

/**
 * Profil altimétrique de la trace — courbe de terrain avec remplissage doux (échelle km/altitude
 * à gauche), et courbe d'allure superposée en escalier (échelle km/allure indépendante à droite),
 * colorée selon l'allure relative de la sortie (rapide → lente).
 */
function ProfileAltimetryChart({ points }: { points: ProfilePoint[] }) {
  const isMobile = useIsMobile()
  const VW = 680
  const VH = isMobile ? 150 : 220
  // En mobile, les légendes d'altitude (gauche) et d'allure (droite) disparaissent : ML/MR n'ont
  // plus besoin de réserver de place pour leur texte, ce qui réduit aussi la marge blanche
  // haut/bas puisque le graphique gagne en hauteur utile relative.
  const MT = isMobile ? 6 : 12, MB = isMobile ? 16 : 24, ML = isMobile ? 8 : 40, MR = isMobile ? 8 : 44
  const chartW = VW - ML - MR
  const chartH = VH - MT - MB
  const baseY = MT + chartH

  const maxKm = points[points.length - 1]?.km || 1
  const minAlt = Math.min(...points.map(p => p.alt))
  const maxAlt = Math.max(...points.map(p => p.alt))
  const altRange = maxAlt - minAlt || 1

  const toX = (km: number) => ML + (km / maxKm) * chartW
  const toY = (alt: number) => MT + (1 - (alt - minAlt) / altRange) * chartH

  const altTicks = [minAlt, minAlt + altRange / 2, maxAlt].map(v => Math.round(v))
  const kmStep = maxKm > 20 ? 5 : maxKm > 8 ? 2 : 1
  const kmTicks: number[] = []
  for (let k = 0; k <= maxKm + 1e-6; k += kmStep) kmTicks.push(+k.toFixed(1))

  const areaPath = [
    `M${toX(0).toFixed(1)},${baseY}`,
    ...points.map(p => `L${toX(p.km).toFixed(1)},${toY(p.alt).toFixed(1)}`),
    `L${toX(maxKm).toFixed(1)},${baseY}`,
    'Z',
  ].join(' ')

  const paceSecs = points.map(p => p.paceSec).filter(v => v > 0)
  const paceDomain = paceSecs.length > 0
    ? { min: Math.min(...paceSecs), max: Math.max(...paceSecs), avg: paceSecs.reduce((a, b) => a + b, 0) / paceSecs.length }
    : null
  const paceToY = (sec: number) => {
    if (!paceDomain) return baseY
    const range = paceDomain.max - paceDomain.min || 1
    return MT + ((sec - paceDomain.min) / range) * chartH
  }

  return (
    <div>
      <p className="widget-card-title">Profil altimétrique &amp; allure</p>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-100 block w-full" style={{ height: VH }}>
        <defs>
          <linearGradient id="profile-alt-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0.02} />
          </linearGradient>
          {paceDomain && points.slice(0, -2).map((p, i) => {
            const next = points[i + 1]
            const stops = getPaceGradientStops(p.paceSec, next.paceSec, paceDomain.avg, paceDomain.min, paceDomain.max)
            return (
              <linearGradient key={i} id={`activity-pace-grad-${i}`} gradientUnits="userSpaceOnUse" x1={toX(next.km)} y1={paceToY(p.paceSec)} x2={toX(next.km)} y2={paceToY(next.paceSec)}>
                {stops.map((s, j) => <stop key={j} offset={`${(s.offset * 100).toFixed(2)}%`} stopColor={s.color} />)}
              </linearGradient>
            )
          })}
        </defs>

        {!isMobile && altTicks.map(a => (
          <g key={a}>
            <line x1={ML} x2={VW - MR} y1={toY(a)} y2={toY(a)} stroke="var(--color-neutral-20)" strokeDasharray="2,3" strokeWidth={0.5} />
            <text x={ML - 6} y={toY(a)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--color-neutral-80)">{a}m</text>
          </g>
        ))}

        <path d={areaPath} fill="url(#profile-alt-gradient)" />
        <path
          d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.km).toFixed(1)},${toY(p.alt).toFixed(1)}`).join(' ')}
          fill="none"
          stroke="#111"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {paceDomain && (
          <>
            {points.slice(0, -1).map((p, i) => {
              const next = points[i + 1]
              const color = getPaceColor(p.paceSec, paceDomain.avg, paceDomain.min, paceDomain.max)
              const hasConnector = i < points.length - 2
              return (
                <g key={i}>
                  <line x1={toX(p.km)} y1={paceToY(p.paceSec)} x2={toX(next.km)} y2={paceToY(p.paceSec)} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
                  {hasConnector && (
                    <line x1={toX(next.km)} y1={paceToY(p.paceSec)} x2={toX(next.km)} y2={paceToY(next.paceSec)} stroke={`url(#activity-pace-grad-${i})`} strokeWidth={2.5} strokeLinecap="round" />
                  )}
                </g>
              )
            })}
            {!isMobile && [paceDomain.min, paceDomain.avg, paceDomain.max].map((sec, i) => (
              <text key={i} x={VW - MR + 6} y={paceToY(sec)} dominantBaseline="middle" fontSize={9} fill="var(--color-neutral-80)">{secToPace(Math.round(sec))}</text>
            ))}
          </>
        )}

        {kmTicks.map(km => (
          <text key={km} x={toX(km)} y={VH - 4} textAnchor="middle" fontSize={9} fill="var(--color-neutral-80)">{km}km</text>
        ))}
      </svg>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-100 text-center first:pl-0 last:pr-0">
      <p className="widget-label widget-label-compact">{label}</p>
      <p className="mt-50 whitespace-nowrap text-[18px] font-extrabold text-neutral-800">{value}</p>
    </div>
  )
}

/** Icône par paramètre d'allure — même logique visuelle que les ColorTag de segment (Gauge/Zap/…). */
const ALLURE_PARAM_ICON: Record<string, IconComponent> = {
  min: Zap,
  plat: Gauge,
  descenteTechnique: TrendingDown,
  max: TrendingUp,
  kmEffort: Mountain,
}

export default function ActivityDetailModal({ session, onClose }: {
  session: DaySession
  onClose: () => void
}) {
  const badge = TYPE_BADGE[session.type]
  const category = session.distanceKm != null ? distanceCategory(session.distanceKm) : null
  const profile = session.distanceKm ? buildActivityProfile(session) : []
  const avgPaceLabel = formatAvgPace(session)
  const allureRow = category ? initAllures.find(a => a.id === category) : undefined

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe max-h-[calc(100vh-24px)] w-full max-w-[640px] overflow-x-hidden overflow-y-auto rounded-3xl shadow-lg">
          <div className="flex items-center justify-between gap-100 px-200 pt-200">
            <div className="flex min-w-0 items-center gap-150">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${badge.bg} ${badge.text}`}>
                <badge.icon className="size-4" strokeWidth={1.75} />
              </span>
              <p className="min-w-0 truncate font-accent text-[16px] font-bold text-neutral-800">{session.label}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-20 hover:text-neutral-800"
              aria-label="Fermer"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-200 px-200">
            <div className="widget-card-glass flex items-stretch divide-x divide-neutral-30 p-200">
              {session.distanceKm != null && <StatItem label="Distance" value={`${session.distanceKm} km`} />}
              {avgPaceLabel != null && <StatItem label="Allure" value={avgPaceLabel} />}
              {session.durationMin != null && <StatItem label="Durée" value={formatDuration(session.durationMin)} />}
              {session.elevation != null && <StatItem label="D+" value={`+${session.elevation} m`} />}
            </div>
          </div>

          {profile.length > 0 && (
            <div className="mt-200 px-200">
              <div className="widget-card-glass p-200">
                <ProfileAltimetryChart points={profile} />
              </div>
            </div>
          )}

          {allureRow && (
            <div className="mt-200 px-200 pb-200">
              <div className="widget-card-glass p-200">
                <p className="widget-card-title">Statistiques de l'activité</p>
                <div className="mt-100 divide-y divide-neutral-30">
                  {allureParams.map(param => {
                    const Icon = ALLURE_PARAM_ICON[param.key]
                    return (
                      <div key={param.key} className="flex items-center gap-100 py-150">
                        <Icon className="size-4 shrink-0 text-primary-400" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-primary-400">{param.label}</p>
                          <p className="mt-25 text-[16px] font-extrabold leading-none text-primary-600">
                            {allureRow[param.key]}{param.unit}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {!allureRow && <div className="pb-200" />}
        </div>
      </div>
    </>,
    document.body
  )
}
