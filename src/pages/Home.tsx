import { TrendingUp, Mountain, MapPin, Wind, Plus, Footprints, Bike, Activity, Target } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

function navigateToNewPlan() {
  window.history.pushState({}, '', '/plans/nouveau')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function Home() {
  return (
    <AppLayout activeItem="accueil" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Hero ── */}
        <section className="pt-100">
          <h1 className="mt-150 text-[42px] text-primary-500 lg:text-[48px]">
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

          {/* Km semaine */}
          <div className="widget-card flex flex-col justify-between gap-200 p-300">
            <div className="flex items-start justify-between">
              <p className="widget-label">Cette semaine</p>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <TrendingUp className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[36px] font-bold leading-none text-primary-500">
              42<span className="ml-50 text-[16px] font-normal text-neutral-80"> km</span>
            </p>
            <span className="inline-flex w-fit items-center gap-75 rounded-full bg-secondary-400/25 px-150 py-[5px] text-[11px] font-semibold text-secondary-700">
              <TrendingUp className="size-3 shrink-0" strokeWidth={2.5} />
              +12 % vs sem. passée
            </span>
          </div>

          {/* Dénivelé */}
          <div className="widget-card flex flex-col justify-between gap-200 p-300">
            <div className="flex items-start justify-between">
              <p className="widget-label">Dénivelé</p>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Mountain className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[36px] font-bold leading-none text-primary-500">
              1 840<span className="ml-50 text-[16px] font-normal text-neutral-80"> m</span>
            </p>
            <p className="text-[12px] text-neutral-80">D+ cumulé</p>
          </div>

          {/* Prochain objectif — spanning 2 rows sur desktop */}
          <div className="widget-card-secondary col-span-2 flex flex-col items-center justify-between gap-300 p-300 text-center lg:col-span-1 lg:row-span-2">
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
                  <span key={label} className="inline-flex items-center gap-50 rounded-full bg-secondary-400/20 px-150 py-50 text-[11px] font-semibold text-secondary-200">
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
              <p className="mt-75 text-[14px] font-medium text-secondary-300/80">23 août 2026</p>
            </div>
          </div>

          {/* Sorties ce mois */}
          <div className="widget-card flex flex-col justify-between gap-200 p-300">
            <div className="flex items-start justify-between">
              <p className="widget-label">Ce mois</p>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Target className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[36px] font-bold leading-none text-primary-500">
              3<span className="ml-50 text-[16px] font-normal text-neutral-80"> sorties</span>
            </p>
            <div className="space-y-75">
              <div className="h-50 w-full overflow-hidden rounded-full bg-neutral-30">
                <div className="h-full rounded-full bg-secondary-500" style={{ width: '37.5%' }} />
              </div>
              <p className="text-[11px] text-neutral-80">Objectif : 8 ce mois</p>
            </div>
          </div>

          {/* Allure moyenne */}
          <div className="widget-card flex flex-col justify-between gap-200 p-300">
            <div className="flex items-start justify-between">
              <p className="widget-label">Allure moy.</p>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
                <Activity className="size-5 text-neutral-300" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[36px] font-bold leading-none text-primary-500">
              6:12<span className="ml-50 text-[16px] font-normal text-neutral-80"> /km</span>
            </p>
            <p className="text-[12px] text-neutral-80">30 derniers jours</p>
          </div>

        </section>

        {/* ── Dernières sorties ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Dernières sorties</p>
            <button className="btn btn-text text-[12px]">Voir tout</button>
          </div>
          {[
            { label: 'Sortie longue — Belledonne', date: 'Dim. 22 juin', km: '28 km', d: '1 420 m', time: '3h12', Icon: Footprints },
            { label: 'Fractionné trail', date: 'Jeu. 19 juin', km: '12 km', d: '340 m', time: '1h04', Icon: Footprints },
            { label: 'Vélo — Col du Glandon', date: 'Sam. 21 juin', km: '64 km', d: '1 850 m', time: '2h48', Icon: Bike },
            { label: 'Récupération active', date: 'Mar. 17 juin', km: '8 km', d: '110 m', time: '52min', Icon: Footprints },
          ].map((run, i) => (
            <div
              key={i}
              className="widget-row flex cursor-pointer items-center justify-between px-200 py-200"
            >
              <div className="flex items-center gap-200">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-0">
                  <run.Icon className="size-4 shrink-0" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-neutral-800">{run.label}</p>
                  <p className="mt-25 text-[12px] text-neutral-80">{run.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-200 text-right">
                <div>
                  <p className="text-[16px] font-bold text-primary-500">{run.km}</p>
                  <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                    <Mountain className="size-3 shrink-0" strokeWidth={2} />
                    {run.d}
                  </p>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-neutral-400">{run.time}</p>
                  <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                    <Wind className="size-3 shrink-0" strokeWidth={2} />
                    durée
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

      </div>
    </AppLayout>
  )
}
