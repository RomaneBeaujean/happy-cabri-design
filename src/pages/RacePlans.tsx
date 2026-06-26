import { useState } from 'react'
import { Trophy, Award, MapPin, Clock, Mountain, ChevronRight, CirclePlus, Search, MoreVertical, Pencil, Link2 } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

function navigateToNewPlan() {
  window.history.pushState({}, '', '/plans/nouveau')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

type Status = 'En cours' | 'Planifié' | 'Terminé'

interface Plan {
  id: number
  name: string
  location: string
  date: string
  distance: string
  elevation: string
  status: Status
  daysLeft?: number
}

const plans: Plan[] = [
  { id: 1, name: 'UTMB CCC',                   location: 'Chamonix',         date: '23 août 2026',  distance: '100 km', elevation: '6 000 m D+', status: 'En cours',  daysLeft: 61  },
  { id: 2, name: "Maxi-Race du Lac d'Annecy",   location: 'Annecy',           date: '15 mai 2027',   distance: '85 km',  elevation: '5 500 m D+', status: 'Planifié',  daysLeft: 324 },
  { id: 3, name: 'Grand Raid des Pyrénées',      location: 'Luz-Saint-Sauveur',date: '27 août 2027',  distance: '80 km',  elevation: '5 200 m D+', status: 'Planifié',  daysLeft: 428 },
  { id: 4, name: 'Trail des Calanques',          location: 'Marseille',        date: '12 mars 2026',  distance: '42 km',  elevation: '2 100 m D+', status: 'Terminé'               },
]

const FILTERS: { id: string; label: string }[] = [
  { id: 'tous',    label: 'Tous'     },
  { id: 'a-venir', label: 'À venir'  },
  { id: 'terminé', label: 'Terminé'  },
]

export default function RacePlans() {
  const [activeFilter, setActiveFilter] = useState('tous')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [openMenuId,   setOpenMenuId]   = useState<number | null>(null)

  const filtered = plans.filter(p => {
    const matchFilter =
      activeFilter === 'tous' ||
      (activeFilter === 'a-venir'  && p.status !== 'Terminé') ||
      (activeFilter === 'terminé'  && p.status === 'Terminé')
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const upcoming = filtered.filter(p => p.status !== 'Terminé')
  const past     = filtered.filter(p => p.status === 'Terminé')

  return (
    <AppLayout activeItem="plans" userInitials="RB" >
      <div className="mx-auto max-w-3xl space-y-300">

        {/* Header + Desktop CTA */}
        <section className="pt-100">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-90">
                Tes prochaines courses et leurs plans associés
              </p>
              <h1 className="mt-150 font-heading text-[2.6rem] font-extrabold leading-tight text-neutral-800 lg:text-5xl">
                Plans de course
              </h1>
            </div>
            <button className="btn btn-primary hidden lg:flex" onClick={navigateToNewPlan}>
              <CirclePlus className="size-4 shrink-0" strokeWidth={2.5} />
              Nouveau plan de course
            </button>
          </div>
          <button className="btn btn-primary btn-full mt-200 lg:hidden" onClick={navigateToNewPlan}>
            <CirclePlus className="size-4 shrink-0" strokeWidth={2.5} />
            Nouveau plan de course
          </button>
        </section>

        {/* Filtres + Recherche */}
        <div className="flex flex-col gap-150 lg:flex-row lg:items-center lg:justify-between">
          {/* Filtres */}
          <div className="flex gap-100 overflow-x-auto pb-50 lg:pb-0">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={[
                  'btn whitespace-nowrap rounded-full px-200 py-100 text-xs font-semibold transition-colors',
                  activeFilter === f.id
                    ? 'bg-neutral-800 text-neutral-0'
                    : 'border border-neutral-40 bg-white/60 text-neutral-600 hover:border-neutral-60 hover:text-neutral-800',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative lg:w-[280px]">
            <Search className="absolute left-200 top-1/2 size-3.5 -translate-y-1/2 text-neutral-60" strokeWidth={2} />
            <input
              type="text"
              placeholder="Rechercher un plan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input input-icon"
            />
          </div>
        </div>

        {/* Liste */}
        <section className="widget-card overflow-hidden p-100">

          {/* Section À VENIR */}
          {upcoming.length > 0 && (
            <>
              <div className="px-200 pb-75 pt-100">
                <p className="font-accent text-[10px] font-semibold uppercase tracking-widest text-neutral-80">À venir</p>
              </div>
              {upcoming.map(plan => (
                <PlanRow key={plan.id} plan={plan} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
              ))}
            </>
          )}

          {/* Section PASSÉES */}
          {past.length > 0 && (
            <>
              <div className={['px-200 pb-75', upcoming.length > 0 ? 'pt-200' : 'pt-100'].join(' ')}>
                <p className="font-accent text-[10px] font-semibold uppercase tracking-widest text-neutral-80">Passées</p>
              </div>
              {past.map(plan => (
                <PlanRow key={plan.id} plan={plan} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
              ))}
            </>
          )}

          {/* Aucun résultat */}
          {filtered.length === 0 && (
            <div className="py-400 text-center">
              <p className="font-accent text-sm text-neutral-80">Aucun plan trouvé</p>
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  )
}

/* ── Ligne d'un plan ── */
function PlanRow({ plan, openMenuId, setOpenMenuId }: {
  plan: Plan
  openMenuId: number | null
  setOpenMenuId: (id: number | null) => void
}) {
  const isPast = plan.status === 'Terminé'
  const menuOpen = openMenuId === plan.id

  return (
    <div
      className="widget-row relative flex cursor-pointer items-center justify-between px-200 py-200"
      onClick={() => setOpenMenuId(null)}
    >
      {/* Gauche : icône + infos */}
      <div className="flex min-w-0 flex-1 items-start gap-200">
        <div className={[
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isPast ? 'bg-neutral-20' : 'bg-secondary-100/80',
        ].join(' ')}>
          {isPast
            ? <Award  className="size-5 text-neutral-400"   strokeWidth={1.75} />
            : <Trophy className="size-5 text-secondary-600" strokeWidth={1.75} />
          }
        </div>
        <div className="min-w-0">
          <p className="widget-title">{plan.name}</p>
          <div className="mt-75 flex flex-wrap items-center gap-x-150 gap-y-50">
            <span className="flex items-center gap-50 font-accent text-[11px] text-neutral-80">
              <MapPin className="size-3 shrink-0" strokeWidth={2} />
              {plan.location}
            </span>
            <span className="flex items-center gap-50 font-accent text-[11px] text-neutral-80">
              <Clock className="size-3 shrink-0" strokeWidth={2} />
              {plan.date}
            </span>
            <span className="flex items-center gap-50 font-accent text-[11px] text-neutral-80">
              <Mountain className="size-3 shrink-0" strokeWidth={2} />
              {plan.distance} · {plan.elevation}
            </span>
          </div>
        </div>
      </div>

      {/* Droite : J-XX ou date + ellipsis + chevron */}
      <div className="ml-200 flex shrink-0 items-center gap-100">
        {!isPast
          ? <p className="font-heading text-base font-bold text-primary-700">J–{plan.daysLeft}</p>
          : <p className="font-accent text-xs text-neutral-80">{plan.date}</p>
        }

        {/* Menu ellipsis */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : plan.id) }}
            className="flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-20 hover:text-neutral-800"
          >
            <MoreVertical className="size-4" strokeWidth={2} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-50 overflow-hidden rounded-xl border border-neutral-20 bg-white shadow-widget" style={{ minWidth: 'max-content' }}>
              <button className="flex w-full items-center gap-150 whitespace-nowrap px-200 py-150 font-accent text-sm text-neutral-700 transition-colors hover:bg-neutral-10">
                <Pencil className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                Renommer
              </button>
              <button className="flex w-full items-center gap-150 whitespace-nowrap px-200 py-150 font-accent text-sm text-neutral-700 transition-colors hover:bg-neutral-10">
                <Link2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                Copier le lien CrewLink
              </button>
            </div>
          )}
        </div>

        <ChevronRight className="size-5 text-neutral-40 shrink-0" />
      </div>
    </div>
  )
}
