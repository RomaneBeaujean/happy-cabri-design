import { TrendingUp, Mountain, Timer, MapPin, Flame, Wind, Plus } from 'lucide-react'
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
          <h1 className="mt-150 text-[2.6rem] font-extrabold leading-tight text-neutral-800 lg:text-5xl">
            Bonjour,{' '}
            <span className="text-primary-500">Romane</span>
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
          <div className="widget-card flex flex-col items-center justify-between p-300 text-center">
            <p className="widget-label">
              Cette semaine
            </p>
            <div className="mt-200">
              <p className="text-4xl font-extrabold text-primary-500">
                42
                <span className="ml-50 text-lg font-medium text-neutral-400"> km</span>
              </p>
              <div className="mt-150 flex items-center justify-center gap-75 text-[11px] font-medium text-primary-400">
                <TrendingUp className="size-3.5 shrink-0" strokeWidth={2.5} />
                +12 % vs semaine passée
              </div>
            </div>
          </div>

          {/* Dénivelé */}
          <div className="widget-card flex flex-col items-center justify-between p-300 text-center">
            <p className="widget-label">
              Dénivelé
            </p>
            <div className="mt-200">
              <p className="text-4xl font-extrabold text-primary-500">
                1 840
                <span className="ml-50 text-lg font-medium text-neutral-400"> m</span>
              </p>
              <div className="mt-150 flex items-center justify-center gap-75 text-[11px] font-medium text-neutral-400">
                <Mountain className="size-3.5 shrink-0" strokeWidth={2} />
                D+ cumulé
              </div>
            </div>
          </div>

          {/* Prochain objectif — spanning 2 rows sur desktop */}
          <div className="widget-card-secondary col-span-2 flex flex-col items-center justify-between p-300 text-center lg:col-span-1 lg:row-span-2">
            <div>
              <p className="widget-label">
                Prochain objectif
              </p>
              <h2 className="mt-200 text-3xl font-extrabold leading-none text-neutral-0">
                UTMB <span className="text-primary-100">CCC</span>
              </h2>
              <div className="mt-200 flex flex-wrap items-center justify-center gap-100">
                {[
                  { Icon: MapPin,   label: 'Chamonix' },
                  { Icon: Mountain, label: '100 km'   },
                  { Icon: Mountain, label: '6 000 m D+' },
                ].map(({ Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-50 rounded-full bg-white/20 px-150 py-50 text-xs font-semibold text-neutral-10">
                    <Icon className="size-3 shrink-0" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="widget-label">
                Compte à rebours
              </p>
              <p className="mt-100 text-5xl font-extrabold text-neutral-0">
                J–61
              </p>
              <p className="mt-75 text-sm font-semibold text-neutral-50">23 août 2026</p>
            </div>
          </div>

          {/* Sorties ce mois */}
          <div className="widget-card flex flex-col items-center justify-between p-300 text-center">
            <p className="widget-label">
              Ce mois
            </p>
            <div className="mt-200">
              <p className="text-4xl font-extrabold text-primary-500">
                3
                <span className="ml-50 text-lg font-medium text-neutral-400"> sorties</span>
              </p>
              <div className="mt-150 flex items-center justify-center gap-75 text-[11px] font-medium text-neutral-400">
                <Flame className="size-3.5 shrink-0" strokeWidth={2} />
                Objectif : 8 ce mois
              </div>
            </div>
          </div>

          {/* Allure moyenne */}
          <div className="widget-card flex flex-col items-center justify-between p-300 text-center">
            <p className="widget-label">
              Allure moy.
            </p>
            <div className="mt-200">
              <p className="text-4xl font-extrabold text-primary-500">
                6:12
                <span className="ml-50 text-lg font-medium text-neutral-400"> /km</span>
              </p>
              <div className="mt-150 flex items-center justify-center gap-75 text-[11px] font-medium text-neutral-400">
                <Timer className="size-3.5 shrink-0" strokeWidth={2} />
                30 derniers jours
              </div>
            </div>
          </div>

        </section>

        {/* ── Dernières sorties ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Dernières sorties</p>
            <button className="btn btn-ghost text-xs">Voir tout</button>
          </div>
          {[
            { label: 'Sortie longue — Belledonne', date: 'Dim. 22 juin', km: '28 km', d: '1 420 m', time: '3h12' },
            { label: 'Fractionné trail', date: 'Jeu. 19 juin', km: '12 km', d: '340 m', time: '1h04' },
            { label: 'Récupération active', date: 'Mar. 17 juin', km: '8 km', d: '110 m', time: '52min' },
          ].map((run, i) => (
            <div
              key={i}
              className="widget-row flex cursor-pointer items-center justify-between px-200 py-200"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-800">{run.label}</p>
                <p className="mt-25 text-xs text-neutral-80">{run.date}</p>
              </div>
              <div className="flex items-center gap-200 text-right">
                <div>
                  <p className="text-base font-bold text-primary-500">{run.km}</p>
                  <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                    <Mountain className="size-3 shrink-0" strokeWidth={2} />
                    {run.d}
                  </p>
                </div>
                <div>
                  <p className="text-base font-bold text-neutral-4000">{run.time}</p>
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
