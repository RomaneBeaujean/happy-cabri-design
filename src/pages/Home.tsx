import { useState } from 'react'
import { TrendingUp, Mountain, MapPin, Plus, Target, Clock } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import ActivityDetailModal, { TYPE_BADGE, formatDuration, formatAvgPace, navigateTo, type DaySession } from '../components/ActivityDetail'

function navigateToNewPlan() {
  navigateTo('/plans/nouveau')
}

const RECENT_SESSIONS: DaySession[] = [
  { id: 'h1', type: 'run',  label: 'Sortie longue — Belledonne', distanceKm: 28, durationMin: 192, elevation: 1420 },
  { id: 'h2', type: 'run',  label: 'Fractionné trail',           distanceKm: 12, durationMin: 64,  elevation: 340  },
  { id: 'h3', type: 'bike', label: 'Vélo — Col du Glandon',      distanceKm: 64, durationMin: 168, elevation: 1850 },
  { id: 'h4', type: 'run',  label: 'Récupération active',        distanceKm: 8,  durationMin: 52,  elevation: 110  },
]

const RECENT_SESSION_DATES: Record<string, string> = {
  h1: 'Dim. 22 juin',
  h2: 'Jeu. 19 juin',
  h3: 'Sam. 21 juin',
  h4: 'Mar. 17 juin',
}

export default function Home() {
  const [activitySession, setActivitySession] = useState<DaySession | null>(null)

  return (
    <AppLayout activeItem="accueil" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Hero ── */}
        <section className="pt-100">
          <h1 className="mt-150 text-primary-500">
            Bonjour,{' '}
            <span className="text-primary-900 font-semibold">Romane</span>
          </h1>
        </section>

        {/* ── Actions rapides ── */}
        <section>
          <button className="btn btn-primary lg:w-auto" onClick={navigateToNewPlan}>
            <Plus className="size-4 shrink-0" strokeWidth={2.5} />
            Nouveau plan de course
          </button>
        </section>
        {/* ── Bento stats ── */}
        <section className="grid grid-cols-2 gap-150 lg:grid-cols-3 lg:gap-200">

          {/* Cette semaine — distance et D+ */}
          <div className="widget-card flex flex-col justify-between gap-200 p-200 lg:p-300">
            <div className="flex items-center gap-100 lg:gap-150">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <TrendingUp className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
              <p className="widget-label">Cette semaine</p>
            </div>
            <div className="space-y-200">
              <div>
                <p className="text-[11px] text-neutral-80">Distance</p>
                <p className="mt-25 text-[28px] font-bold leading-none text-primary-500">42<span className="ml-50 text-[14px] font-normal text-neutral-80"> km</span></p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-80">Dénivelé positif</p>
                <p className="mt-25 text-[28px] font-bold leading-none text-primary-500">1 840<span className="ml-50 text-[14px] font-normal text-neutral-80"> m</span></p>
              </div>
            </div>
          </div>

          {/* Cette année — distance et D+ */}
          <div className="widget-card flex flex-col justify-between gap-200 p-200 lg:p-300">
            <div className="flex items-center gap-100 lg:gap-150">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Mountain className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
              <p className="widget-label">Cette année</p>
            </div>
            <div className="space-y-200">
              <div>
                <p className="text-[11px] text-neutral-80">Distance</p>
                <p className="mt-25 text-[28px] font-bold leading-none text-primary-500">342<span className="ml-50 text-[14px] font-normal text-neutral-80"> km</span></p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-80">Dénivelé positif</p>
                <p className="mt-25 text-[28px] font-bold leading-none text-primary-500">8 200<span className="ml-50 text-[14px] font-normal text-neutral-80"> m</span></p>
              </div>
            </div>
          </div>

          {/* Prochain objectif — spanning 2 rows sur desktop */}
          <div className="widget-card-secondary col-span-2 flex flex-col items-center justify-between gap-300 p-200 text-center lg:col-span-1 lg:row-span-2 lg:p-300">
            <div>
              <p className="widget-label">Prochain objectif</p>
              <h2 className="mt-200 text-[30px] font-extrabold leading-none text-neutral-0">
                UTMB <span className="text-secondary-400">CCC</span>
              </h2>
              <div className="mt-200 flex flex-wrap items-center justify-center gap-100">
                {[
                  { Icon: MapPin,   label: 'Chamonix' },
                  { Icon: Mountain, label: '100 km'   },
                  { Icon: Mountain, label: '6 000 m D+' },
                ].map(({ Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-50 rounded-full bg-neutral-0/20 px-150 py-50 text-[11px] font-semibold text-neutral-10">
                    <Icon className="size-3 shrink-0" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="widget-label">Compte à rebours</p>
              <p className="mt-100 text-[48px] font-extrabold text-neutral-0">
                J–<span className="text-secondary-400">61</span>
              </p>
              <p className="mt-75 text-[14px] font-medium text-neutral-20/80">23 août 2026</p>
            </div>
          </div>

          {/* Courses réalisées */}
          <div className="widget-card flex flex-col gap-200 p-200 lg:p-300">
            <div className="flex items-center gap-100 lg:gap-150">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Target className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
              <p className="widget-label">Courses réalisées</p>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[36px] font-bold leading-none text-primary-500">3</p>
            </div>
          </div>

          {/* Course la plus longue */}
          <div className="widget-card flex flex-col justify-between gap-200 p-200 lg:p-300">
            <div className="flex items-center gap-100 lg:gap-150">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Clock className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
              <p className="widget-label">Course la plus longue</p>
            </div>
            <div className="space-y-200">
              <p className="truncate text-[13px] font-semibold text-neutral-800">Grand Raid Belledonne</p>
              <div>
                <p className="text-[11px] text-neutral-80">Distance</p>
                <p className="mt-25 text-[22px] font-bold leading-none text-primary-500">28<span className="ml-50 text-[13px] font-normal text-neutral-80"> km</span></p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-80">Durée</p>
                <p className="mt-25 text-[22px] font-bold leading-none text-primary-500">3h12</p>
              </div>
            </div>
          </div>

        </section>

        {/* ── Dernières sorties ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Dernières sorties</p>
            <button className="btn btn-text" onClick={() => navigateTo('/calendrier')}>Voir tout</button>
          </div>
          {RECENT_SESSIONS.map(session => {
            const badge = TYPE_BADGE[session.type]
            const avgPaceLabel = formatAvgPace(session)
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => setActivitySession(session)}
                className="widget-row flex w-full cursor-pointer items-center justify-between px-200 py-200 text-left"
              >
                <div className="flex items-center gap-200">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${badge.bg} ${badge.text}`}>
                    <badge.icon className="size-4 shrink-0" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-800">{session.label}</p>
                    <p className="mt-25 text-[12px] text-neutral-80">{RECENT_SESSION_DATES[session.id]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-200 text-right">
                  {session.distanceKm != null && (
                    <div>
                      <p className="text-[16px] font-bold text-primary-500">{session.distanceKm} km</p>
                      {session.elevation != null && (
                        <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                          <Mountain className="size-3 shrink-0" strokeWidth={2} />
                          {session.elevation} m
                        </p>
                      )}
                    </div>
                  )}
                  {session.durationMin != null && (
                    <div>
                      <p className="text-[16px] font-bold text-neutral-400">{formatDuration(session.durationMin)}</p>
                      {avgPaceLabel && (
                        <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                          {avgPaceLabel}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </section>

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
