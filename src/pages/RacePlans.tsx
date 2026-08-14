import { useState, useRef, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Award, MapPin, Clock, Mountain, ChevronRight, Search, MoreVertical, Pencil, Link2, Trash2, AlertTriangle, Plus, RotateCcw } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import FilterTabs from '../components/FilterTabs'

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

const initPlans: Plan[] = [
  { id: 1, name: 'UTMB CCC',                   location: 'Chamonix',         date: '23 août 2026',  distance: '100 km', elevation: '6 000 m D+', status: 'En cours',  daysLeft: 61  },
  { id: 2, name: "Maxi-Race du Lac d'Annecy",   location: 'Annecy',           date: '15 mai 2027',   distance: '85 km',  elevation: '5 500 m D+', status: 'Planifié',  daysLeft: 324 },
  { id: 3, name: 'Grand Raid des Pyrénées',      location: 'Luz-Saint-Sauveur',date: '27 août 2027',  distance: '80 km',  elevation: '5 200 m D+', status: 'Planifié',  daysLeft: 428 },
  { id: 4, name: 'Trail des Calanques',          location: 'Marseille',        date: '12 mars 2026',  distance: '42 km',  elevation: '2 100 m D+', status: 'Terminé'               },
]

const FILTERS = [
  { value: 'tous',    label: 'Tous'     },
  { value: 'a-venir', label: 'À venir'  },
  { value: 'terminé', label: 'Terminé'  },
]

export default function RacePlans() {
  const [plans, setPlans]               = useState(initPlans)
  const [activeFilter, setActiveFilter] = useState('tous')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [openMenuId,   setOpenMenuId]   = useState<number | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)

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
              <h1 className="mt-150 leading-tight text-neutral-800">
                Plans de course
              </h1>
            </div>
            <button className="btn btn-primary hidden lg:flex" onClick={navigateToNewPlan}>
              <Plus className="size-4 shrink-0" strokeWidth={2.5} />
              Nouveau plan de course
            </button>
          </div>
          <button className="btn btn-primary mt-200 flex lg:hidden" onClick={navigateToNewPlan}>
            <Plus className="size-4 shrink-0" strokeWidth={2.5} />
            Nouveau plan de course
          </button>
        </section>

        {/* Filtres + Recherche */}
        <div className="flex flex-col gap-150 lg:flex-row lg:items-center lg:justify-between">
          {/* Filtres */}
          <FilterTabs value={activeFilter} options={FILTERS} onChange={setActiveFilter} className="lg:pb-0" />

          {/* Recherche */}
          <div className="relative lg:w-[280px]">
            <Search className="absolute left-200 top-1/2 size-3.5 -translate-y-1/2 text-neutral-60" strokeWidth={2} />
            <input
              type="text"
              placeholder="Rechercher un plan de course"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input input-icon pl-10.5"
            />
          </div>
        </div>

        {/* Liste */}
        <section className="widget-card overflow-hidden p-100">

          {/* Section À VENIR */}
          {upcoming.length > 0 && (
            <>
              <div className="px-200 pb-75 pt-100">
                <p className="text-[10px] eyebrow text-neutral-80">À venir</p>
              </div>
              {upcoming.map(plan => (
                <PlanRow key={plan.id} plan={plan} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} onDelete={setPlanToDelete} />
              ))}
            </>
          )}

          {/* Section PASSÉES */}
          {past.length > 0 && (
            <>
              <div className={['px-200 pb-75', upcoming.length > 0 ? 'pt-200' : 'pt-100'].join(' ')}>
                <p className="text-[10px] eyebrow text-neutral-80">Passées</p>
              </div>
              {past.map(plan => (
                <PlanRow key={plan.id} plan={plan} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} onDelete={setPlanToDelete} />
              ))}
            </>
          )}

          {/* Aucun résultat */}
          {filtered.length === 0 && (
            plans.length === 0 ? (
              <EmptyState
                icon={<Mountain className="size-6 text-neutral-300" strokeWidth={1.5} />}
                title="Aucun plan de course"
                description="Créez votre premier plan pour préparer votre prochaine course : allures, ravitaillement, altimétrie."
                action={{ label: 'Nouveau plan de course', icon: <Plus className="size-4 shrink-0" strokeWidth={2.5} />, onClick: navigateToNewPlan }}
              />
            ) : (
              <EmptyState
                icon={<Search className="size-6 text-neutral-300" strokeWidth={1.5} />}
                title="Aucun plan trouvé"
                description="Essayez un autre mot-clé ou réinitialisez les filtres."
                action={{ label: 'Réinitialiser les filtres', icon: <RotateCcw className="size-4 shrink-0" strokeWidth={2} />, onClick: () => { setActiveFilter('tous'); setSearchQuery('') } }}
              />
            )
          )}
        </section>

      </div>

      {planToDelete && (
        <DeletePlanModal
          planName={planToDelete.name}
          onConfirm={() => {
            setPlans(pl => pl.filter(p => p.id !== planToDelete.id))
            setPlanToDelete(null)
          }}
          onClose={() => setPlanToDelete(null)}
        />
      )}
    </AppLayout>
  )
}

/* ── Empty state ── */
function EmptyState({ icon, title, description, action }: {
  icon: ReactNode
  title: string
  description: string
  action: { label: string; icon: ReactNode; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center px-300 py-500 text-center">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
        {icon}
      </div>
      <p className="mt-200 font-accent text-[17px] font-bold text-neutral-800">{title}</p>
      <p className="mt-75 max-w-[320px] text-[13px] text-neutral-500">{description}</p>
      <button className="btn btn-primary mt-300" onClick={action.onClick}>
        {action.icon}
        {action.label}
      </button>
    </div>
  )
}

/* ── Ligne d'un plan ── */
function PlanRow({ plan, openMenuId, setOpenMenuId, onDelete }: {
  plan: Plan
  openMenuId: number | null
  setOpenMenuId: (id: number | null) => void
  onDelete: (plan: Plan) => void
}) {
  const isPast = plan.status === 'Terminé'
  const menuOpen = openMenuId === plan.id
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  function toggleMenu(e: MouseEvent) {
    e.stopPropagation()
    if (!menuOpen && menuBtnRef.current) {
      const r = menuBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpenMenuId(menuOpen ? null : plan.id)
  }

  return (
    <div
      className="widget-row relative flex cursor-pointer items-center justify-between px-200 py-200"
      onClick={() => {
        window.history.pushState({}, '', `/plans/${plan.id}`)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
    >
      {/* Gauche : icône + infos */}
      <div className="flex min-w-0 flex-1 items-start gap-200">
        <div className={[
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isPast ? 'bg-primary-500' : 'bg-secondary-700',
        ].join(' ')}>
          {isPast
            ? <Award  className="size-5 text-neutral-0"   strokeWidth={1.75} />
            : <Mountain className="size-5 text-neutral-0" strokeWidth={1.75} />
          }
        </div>
        <div className="min-w-0">
          <p className="widget-title">{plan.name}</p>
          <div className="mt-75 flex flex-wrap items-center gap-x-150 gap-y-50">
            <span className="flex items-center gap-50 text-[11px] text-neutral-80">
              <MapPin className="size-3 shrink-0" strokeWidth={2} />
              {plan.location}
            </span>
            <span className="flex items-center gap-50 text-[11px] text-neutral-80">
              <Clock className="size-3 shrink-0" strokeWidth={2} />
              {plan.date}
            </span>
            <span className="flex items-center gap-50 text-[11px] text-neutral-80">
              <Mountain className="size-3 shrink-0" strokeWidth={2} />
              {plan.distance} · {plan.elevation}
            </span>
          </div>
        </div>
      </div>

      {/* Droite : J-XX + ellipsis + chevron */}
      <div className="ml-200 flex shrink-0 items-center gap-100">
        {!isPast &&
          <p className="text-[16px] font-bold text-primary-700">J–{plan.daysLeft}</p>
        }

        {/* Menu ellipsis */}
        <button
          ref={menuBtnRef}
          onClick={toggleMenu}
          className="flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-20 hover:text-neutral-800"
        >
          <MoreVertical className="size-4" strokeWidth={2} />
        </button>

        {menuOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[998]" onClick={e => { e.stopPropagation(); setOpenMenuId(null) }} />
            <div
              className="fixed z-[999] overflow-hidden rounded-xl border border-neutral-20 bg-white shadow-widget"
              style={{ top: menuPos.top, right: menuPos.right, minWidth: 'max-content' }}
              onClick={e => e.stopPropagation()}
            >
              <button className="flex w-full items-center gap-150 whitespace-nowrap px-200 py-150 text-[14px] text-neutral-700 transition-colors hover:bg-neutral-10">
                <Pencil className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                Renommer
              </button>
              <button className="flex w-full items-center gap-150 whitespace-nowrap px-200 py-150 text-[14px] text-neutral-700 transition-colors hover:bg-neutral-10">
                <Link2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
                Copier le lien CrewLink
              </button>
              <button
                onClick={() => { setOpenMenuId(null); onDelete(plan) }}
                className="flex w-full items-center gap-150 whitespace-nowrap px-200 py-150 text-[14px] text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-4 shrink-0" strokeWidth={1.75} />
                Supprimer
              </button>
            </div>
          </>,
          document.body
        )}

        <ChevronRight className="size-5 text-neutral-40 shrink-0" />
      </div>
    </div>
  )
}

/* ── Confirmation de suppression ── */
function DeletePlanModal({ planName, onConfirm, onClose }: {
  planName: string
  onConfirm: () => void
  onClose: () => void
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-200 pt-200">
            <div className="flex items-start gap-150">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="size-4.5" strokeWidth={2} />
              </span>
              <div>
                <p className="font-accent text-[16px] font-bold text-neutral-800">Supprimer ce plan de course ?</p>
                <p className="mt-50 text-[13px] text-neutral-600">
                  {planName} sera définitivement supprimé. Cette action est irréversible.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-text" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="btn bg-red-500 text-white hover:bg-red-600!"
              onClick={onConfirm}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
