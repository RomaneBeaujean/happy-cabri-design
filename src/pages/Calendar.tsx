import { useState, useEffect, type Key } from 'react'
import { createPortal } from 'react-dom'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { ChevronLeft, ChevronRight, Bike, Dumbbell, Pencil } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import FilterTabs from '../components/FilterTabs'
import ColorTag from '../components/ColorTag'
import Runner from '../components/icons/Runner'
import ActivityDetailModal, {
  type IconComponent,
  type SportFilter,
  type SessionType,
  type DaySession,
  TYPE_BADGE,
  formatDuration,
  openSession,
} from '../components/ActivityDetail'

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const SPORT_META: Record<SportFilter, { label: string; icon: IconComponent; color: string; unit: 'km' | 'h' }> = {
  run:      { label: 'Course & trail', icon: Runner,   color: 'var(--color-secondary-600)', unit: 'km' },
  bike:     { label: 'Vélo',           icon: Bike,     color: '#0D9488' /* teal-600 */,       unit: 'km' },
  strength: { label: 'Renforcement',   icon: Dumbbell, color: '#DB2777' /* pink-600 */,       unit: 'h'  },
}

/* Couleur des tags de la grille du calendrier — activités en primary, courses (plan de course) en secondary-700 */
function tagBg(type: SessionType): string {
  return type === 'race' ? 'var(--color-secondary-700)' : 'var(--color-primary-500)'
}

const RACE_DAY = 29

const sessionsByDay: Record<number, DaySession[]> = {
  2:  [{ id: 's1',  type: 'run',      label: 'Footing endurance',          distanceKm: 8,   durationMin: 45,  elevation: 90  }],
  5:  [{ id: 's2',  type: 'bike',     label: 'Sortie vélo route',          distanceKm: 42,  durationMin: 95,  elevation: 380 }],
  7:  [{ id: 's3',  type: 'strength', label: 'Renforcement haut du corps', durationMin: 40 }],
  9:  [{ id: 's4',  type: 'strength', label: 'Renforcement bas du corps',  durationMin: 50 }],
  12: [{ id: 's5',  type: 'run',      label: 'Fractionné piste',           distanceKm: 10,  durationMin: 50,  elevation: 20  }],
  14: [
    { id: 's6',  type: 'run',  label: 'Footing récupération', distanceKm: 6,  durationMin: 35, elevation: 60 },
    { id: 's7',  type: 'bike', label: 'Home-trainer',         distanceKm: 20, durationMin: 40, elevation: 0  },
  ],
  16: [{ id: 's8',  type: 'bike',     label: 'Home-trainer',               distanceKm: 30,  durationMin: 60,  elevation: 0   }],
  18: [{ id: 's9',  type: 'strength', label: 'Gainage & mobilité',         durationMin: 35 }],
  19: [{ id: 's10', type: 'run',      label: 'Sortie longue',              distanceKm: 22,  durationMin: 130, elevation: 780 }],
  21: [
    { id: 's11', type: 'bike', label: 'Sortie vélo route',    distanceKm: 35, durationMin: 80, elevation: 250 },
    { id: 's12', type: 'run',  label: 'Footing récupération', distanceKm: 5,  durationMin: 30, elevation: 40  },
  ],
  25: [{ id: 's13', type: 'run',      label: 'Footing endurance',          distanceKm: 9,   durationMin: 48,  elevation: 100 }],
  [RACE_DAY]: [{ id: 's16', type: 'race', label: 'UTMB CCC', location: 'Chamonix', distanceKm: 100, elevation: 6000, planId: 1 }],
}

const TODAY = 25
const START_OFFSET = 6 // juillet 2026 commence un dimanche (offset 6)
const DAYS_IN_MONTH = 30

const cells: (number | null)[] = [
  ...Array(START_OFFSET).fill(null),
  ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
]
while (cells.length % 7 !== 0) cells.push(null)

/* ── Volume hebdo — 12 dernières semaines (~3 mois) à partir d'aujourd'hui, un point par semaine ── */
const MONTH_BY_WEEK: Record<number, string> = { 0: 'MAI', 4: 'JUIN', 8: 'JUIL' }

interface WeekStat { distanceKm?: number; durationMin: number; elevation?: number }

const WEEKLY_STATS: Record<SportFilter, WeekStat[]> = {
  run: [31, 27, 33, 29, 36, 31, 38, 33, 40, 35, 44, 28].map(km => ({
    distanceKm: km,
    durationMin: Math.round(km * 5.5),
    elevation: Math.round(km * 11),
  })),
  bike: [35, 52, 48, 61, 55, 68, 58, 72, 65, 78, 70, 64].map(km => ({
    distanceKm: km,
    durationMin: Math.round(km * 2.4),
    elevation: Math.round(km * 7),
  })),
  strength: [1.5, 0.5, 2, 1.5, 1, 2.5, 2, 1.5, 3, 2, 2.5, 1.5].map(h => ({
    durationMin: Math.round(h * 60),
  })),
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

function chartValue(stat: WeekStat, unit: 'km' | 'h') {
  return unit === 'km' ? (stat.distanceKm ?? 0) : stat.durationMin / 60
}

function formatVolume(value: number, unit: 'km' | 'h') {
  return unit === 'km' ? `${Math.round(value)} km` : formatDuration(Math.round(value * 60))
}

function WeeklyVolumeChart({ sport, selectedWeek, onSelectWeek }: {
  sport: SportFilter
  selectedWeek: number
  onSelectWeek: (week: number) => void
}) {
  const { color, unit } = SPORT_META[sport]
  const data = WEEKLY_STATS[sport].map((stat, week) => ({ week, value: chartValue(stat, unit) }))
  const isMobile = useIsMobile()
  const yAxisWidth = isMobile ? 0 : 48
  const rightMargin = 12

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 28, right: rightMargin, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-neutral-10)" strokeWidth={1} horizontal={false} />
          <ReferenceLine x={selectedWeek} stroke="var(--color-secondary-500)" strokeWidth={1} />
          <XAxis
            dataKey="week"
            tick={(props: { x?: string | number; y?: string | number; payload?: { value?: number } }) => {
              const label = MONTH_BY_WEEK[props.payload?.value ?? -1]
              if (!label) return <g />
              return (
                <text
                  x={props.x}
                  y={Number(props.y ?? 0) + 12}
                  textAnchor="start"
                  fontSize={10}
                  fill="var(--color-neutral-80)"
                  fontFamily="Quicksand, sans-serif"
                >
                  {label}
                </text>
              )
            }}
            axisLine={false}
            tickLine={false}
            interval={0}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            hide={isMobile}
            tickFormatter={v => unit === 'km' ? `${Math.round(v)} km` : `${v}h`}
            tick={{ fontSize: 10, fill: 'var(--color-neutral-80)', fontFamily: 'Quicksand, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={yAxisWidth}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#volumeGradient)"
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number; key?: Key | null }) => {
              const { cx = 0, cy = 0, index = 0, key } = props
              const isSelected = index === selectedWeek
              const textAnchor = index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'
              const textX = textAnchor === 'start' ? cx + 4 : textAnchor === 'end' ? cx - 4 : cx
              return (
                <g key={key}>
                  <circle cx={cx} cy={cy} r={isSelected ? 5 : 3} fill={isSelected ? color : 'white'} stroke={color} strokeWidth={2} />
                  {isSelected && <circle cx={cx} cy={cy} r={11} fill={color} fillOpacity={0.15} />}
                  {isSelected && (
                    <text x={textX} y={cy - 18} textAnchor={textAnchor} fontSize={12} fontWeight={700} fill={color} fontFamily="Quicksand, sans-serif">
                      {formatVolume(data[index].value, unit)}
                    </text>
                  )}
                </g>
              )
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Zones cliquables — une colonne par semaine, indépendantes des évènements internes de recharts */}
      <div
        className="absolute inset-y-0 flex"
        style={{ left: yAxisWidth, right: rightMargin }}
      >
        {data.map((d, index) => (
          <button
            key={d.week}
            type="button"
            aria-label={`Semaine ${index + 1}`}
            onClick={() => onSelectWeek(index)}
            onFocus={() => onSelectWeek(index)}
            className="h-full flex-1 cursor-pointer outline-none"
          />
        ))}
      </div>
    </div>
  )
}

const LAST_WEEK_INDEX = WEEKLY_STATS.run.length - 1

const DEFAULT_GOALS: Record<SportFilter, number> = { run: 40, bike: 70, strength: 3 }
const DEFAULT_ELEVATION_GOAL = 800
const ELEVATION_COLOR = '#B45309' /* amber-700 */

function formatByUnit(v: number, unit: 'km' | 'h' | 'm') {
  return unit === 'm' ? `${Math.round(v)} m` : formatVolume(v, unit)
}

function GoalBar({ label, color, done, goal, unit }: {
  label: string
  color: string
  done: number
  goal: number
  unit: 'km' | 'h' | 'm'
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0
  return (
    <div>
      <div className="mb-50 flex items-center justify-between">
        <span className="text-[12px] font-medium text-neutral-600">{label}</span>
        <span className="text-[12px] text-neutral-500">
          {formatByUnit(done, unit)} <span className="text-neutral-400">/ {formatByUnit(goal, unit)}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-10">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function GoalCard({ goals, elevationGoal, enabled, onEdit }: {
  goals: Record<SportFilter, number>
  elevationGoal: number
  enabled: Record<SportFilter, boolean>
  onEdit: () => void
}) {
  const activeSports = (Object.keys(SPORT_META) as SportFilter[]).filter(sport => enabled[sport])
  return (
    <section className="widget-card overflow-hidden p-200">
      <div className="mb-150 flex items-center justify-between">
        <p className="widget-title">Objectifs hebdomadaires</p>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-20 hover:text-neutral-800"
          onClick={onEdit}
          aria-label="Modifier les objectifs"
        >
          <Pencil className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="divide-y divide-neutral-40">
        {activeSports.map(sport => {
          const meta = SPORT_META[sport]
          return (
            <div key={sport} className="py-200 first:pt-0 last:pb-0">
              <span className="mb-100 flex items-center gap-75 text-[13px] font-medium text-neutral-700">
                <meta.icon className="size-4" strokeWidth={2} style={{ color: meta.color }} />
                {meta.label}
              </span>
              <div className="space-y-100">
                <GoalBar
                  label={meta.unit === 'h' ? 'Durée' : 'Distance'}
                  color={meta.color}
                  done={chartValue(WEEKLY_STATS[sport][LAST_WEEK_INDEX], meta.unit)}
                  goal={goals[sport]}
                  unit={meta.unit}
                />
                {sport === 'run' && (
                  <GoalBar
                    label="D+"
                    color={ELEVATION_COLOR}
                    done={WEEKLY_STATS.run[LAST_WEEK_INDEX].elevation ?? 0}
                    goal={elevationGoal}
                    unit="m"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Switch({ checked, onChange, color }: { checked: boolean; onChange: () => void; color: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative h-[22px] w-10 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? color : 'var(--color-neutral-40)' }}
    >
      <span
        className="absolute left-[3px] top-[3px] size-[16px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function GoalModalField({ label, unit, value, onChange, step = 1 }: {
  label: string
  unit: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div className="space-y-75">
      <p className="widget-label widget-label-compact">{label}</p>
      <div className="flex items-center gap-75">
        <input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="input flex-1 py-100 text-[13px]"
        />
        <span className="shrink-0 text-[13px] font-medium text-neutral-400">{unit}</span>
      </div>
    </div>
  )
}

function GoalModal({ goals, elevationGoal, enabled, onSave, onClose }: {
  goals: Record<SportFilter, number>
  elevationGoal: number
  enabled: Record<SportFilter, boolean>
  onSave: (goals: Record<SportFilter, number>, elevationGoal: number, enabled: Record<SportFilter, boolean>) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(goals)
  const [elevationDraft, setElevationDraft] = useState(elevationGoal)
  const [enabledDraft, setEnabledDraft] = useState(enabled)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe max-h-[calc(100vh-24px)] w-full max-w-[380px] overflow-x-hidden overflow-y-auto rounded-3xl shadow-lg">
          <div className="px-200 pt-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Objectif hebdomadaire</p>
            <p className="mt-50 text-[13px] text-neutral-600">Définissez votre volume cible pour chaque sport.</p>
          </div>

          <div className="space-y-150 px-200 py-200">
            {(Object.keys(SPORT_META) as SportFilter[]).map(sport => {
              const meta = SPORT_META[sport]
              const sportEnabled = enabledDraft[sport]
              return (
                <div key={sport} className="widget-card-glass p-150">
                  <div className="mb-150 flex items-center gap-100">
                    <Switch
                      checked={sportEnabled}
                      onChange={() => setEnabledDraft(e => ({ ...e, [sport]: !e[sport] }))}
                      color={meta.color}
                    />
                    <span className="widget-card-title flex items-center gap-75">
                      <meta.icon className="size-4" strokeWidth={2} style={{ color: sportEnabled ? meta.color : 'var(--color-neutral-300)' }} />
                      {meta.label}
                    </span>
                  </div>

                  {sportEnabled && (
                    <div className="space-y-100 pl-11">
                      <GoalModalField
                        label={meta.unit === 'h' ? 'Durée' : 'Distance'}
                        unit={meta.unit}
                        value={draft[sport]}
                        onChange={v => setDraft(d => ({ ...d, [sport]: v }))}
                        step={meta.unit === 'km' ? 1 : 0.5}
                      />
                      {sport === 'run' && (
                        <GoalModalField
                          label="D+"
                          unit="m"
                          value={elevationDraft}
                          onChange={setElevationDraft}
                          step={50}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-text" onClick={onClose}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={() => onSave(draft, elevationDraft, enabledDraft)}>Enregistrer</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function Calendar() {
  const isMobile = useIsMobile()
  const [sport, setSport] = useState<SportFilter>('run')
  const [selectedWeek, setSelectedWeek] = useState(LAST_WEEK_INDEX)
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [elevationGoal, setElevationGoal] = useState(DEFAULT_ELEVATION_GOAL)
  const [enabledSports, setEnabledSports] = useState<Record<SportFilter, boolean>>({ run: true, bike: true, strength: true })
  const [editingGoals, setEditingGoals] = useState(false)
  const [activitySession, setActivitySession] = useState<DaySession | null>(null)

  const weekStat = WEEKLY_STATS[sport][selectedWeek]
  const sportOptions = (Object.keys(SPORT_META) as SportFilter[]).map(id => {
    const meta = SPORT_META[id]
    return { value: id, label: meta.label, icon: <meta.icon className="size-3.5 shrink-0" strokeWidth={2} /> }
  })
  return (
    <AppLayout activeItem="calendrier" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* Header */}
        <section className="pt-100">
          <h1 className="mt-150 leading-tight text-neutral-800">
            Calendrier
          </h1>
        </section>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button className="flex size-9 items-center justify-center rounded-full bg-neutral-0/60 text-neutral-700 shadow-widget backdrop-blur-xl transition-colors hover:bg-neutral-0/80">
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <p className="text-[16px] font-bold text-neutral-800">Juillet 2026</p>
          <button className="flex size-9 items-center justify-center rounded-full bg-neutral-0/60 text-neutral-700 shadow-widget backdrop-blur-xl transition-colors hover:bg-neutral-0/80">
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Calendar grid */}
        <section className="widget-card overflow-hidden p-100">
          {/* Day headers */}
          <div className="grid grid-cols-7">
            {DAYS.map((d, i) => (
              <div key={i} className="flex items-center justify-center py-150">
                <span className="widget-label">{d}</span>
              </div>
            ))}
          </div>

          <div className="space-y-25">
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <div key={week} className="grid grid-cols-7 gap-x-25">
              {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
                if (!day) return <div key={col} />

                const daySessions = sessionsByDay[day]
                const isToday = day === TODAY
                const visibleSessions = daySessions?.slice(0, 2) ?? []
                const hiddenCount = daySessions ? daySessions.length - visibleSessions.length : 0

                return (
                  <div
                    key={col}
                    className="relative flex flex-col items-center gap-50 rounded-2xl px-25 py-150 lg:py-200"
                  >
                    <span className={[
                      'flex size-6 items-center justify-center rounded-full text-[10px]',
                      isToday ? 'bg-secondary-100 font-bold text-secondary-800' : 'font-semibold text-neutral-600',
                    ].join(' ')}>
                      {day}
                    </span>
                    {visibleSessions.length > 0 && (
                      <div className="flex w-full flex-col items-stretch gap-25">
                        {visibleSessions.map(s => {
                          const badge = TYPE_BADGE[s.type]
                          return isMobile ? (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => openSession(s, setActivitySession)}
                              className="flex size-6 shrink-0 items-center justify-center self-center rounded-full"
                              style={{ backgroundColor: tagBg(s.type) }}
                              aria-label={s.label}
                            >
                              <badge.icon className="size-3 text-neutral-0" strokeWidth={2} />
                            </button>
                          ) : (
                            <ColorTag
                              key={s.id}
                              size="medium"
                              color={s.type === 'race' ? 'secondary' : 'primary'}
                              variant="soft"
                              style={s.type === 'race' ? { backgroundColor: 'var(--color-secondary-700)', color: '#fff' } : undefined}
                              fluid
                              icon={<badge.icon className="size-3" strokeWidth={2} />}
                              label={s.label}
                              onClick={() => openSession(s, setActivitySession)}
                            />
                          )
                        })}
                        {hiddenCount > 0 && (
                          <span className="px-50 text-[9px] font-semibold text-neutral-500">
                            +{hiddenCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          </div>
        </section>

        {/* Volume hebdomadaire */}
        <section className="widget-card overflow-hidden pt-0 pr-150 pb-100 pl-150">
          <div className="flex items-center justify-between py-150 px-200">
            <p className="widget-title">Volume hebdomadaire</p>
          </div>

          {/* Filtres par sport */}
          <div className="pl-150 pr-150">
          <FilterTabs
            value={sport}
            onChange={id => { setSport(id); setSelectedWeek(LAST_WEEK_INDEX) }}
            options={sportOptions}
            size="xsmall"
            className="mb-150"
          />
          </div>

          {/* Stats de la semaine sélectionnée */}
          <div className="pl-150 pr-150 mb-50 flex items-center gap-300">
            {weekStat.distanceKm != null && (
              <div>
                <p className="widget-label widget-label-compact">Distance</p>
                <p className="mt-25 text-[20px] font-extrabold text-neutral-800">{weekStat.distanceKm} km</p>
              </div>
            )}
            <div className={weekStat.distanceKm != null ? 'border-l border-neutral-30 pl-300' : ''}>
              <p className="widget-label widget-label-compact">Temps</p>
              <p className="mt-25 text-[20px] font-extrabold text-neutral-800">{formatDuration(weekStat.durationMin)}</p>
            </div>
            {weekStat.elevation != null && (
              <div className="border-l border-neutral-30 pl-300">
                <p className="widget-label widget-label-compact">D+</p>
                <p className="mt-25 text-[20px] font-extrabold text-neutral-800">{weekStat.elevation} m</p>
              </div>
            )}
          </div>

          <WeeklyVolumeChart sport={sport} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </section>

        {/* Objectif hebdo */}
        <GoalCard goals={goals} elevationGoal={elevationGoal} enabled={enabledSports} onEdit={() => setEditingGoals(true)} />

        {editingGoals && (
          <GoalModal
            goals={goals}
            elevationGoal={elevationGoal}
            enabled={enabledSports}
            onClose={() => setEditingGoals(false)}
            onSave={(g, elev, en) => { setGoals(g); setElevationGoal(elev); setEnabledSports(en); setEditingGoals(false) }}
          />
        )}

      </div>

      {activitySession && (
        <ActivityDetailModal
          session={activitySession}
          onClose={() => setActivitySession(null)}
        />
      )}
    </AppLayout>
  )
}
