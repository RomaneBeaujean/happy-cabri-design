import { TrendingUp, Mountain, Timer, Plus, MapPin, Flame, Wind } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

export default function Home() {
  return (
    <AppLayout activeItem="accueil" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Hero ── */}
        <section className="pt-100">
          <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-90">
            Trail · Montagne · Endurance
          </p>
          <h1 className="mt-150 font-heading text-[2.6rem] font-extrabold leading-tight text-neutral-800 lg:text-5xl">
            Bonjour,{' '}
            <span className="text-secondary-500">Romane</span>
          </h1>
          <p className="mt-150 font-body text-base text-neutral-80">
            Chaque mètre de dénivelé te rapproche du sommet.
          </p>
        </section>

        {/* ── Actions rapides ── */}
        <section className="grid grid-cols-3">
          <button className="cursor-pointer flex items-center justify-between rounded-2xl bg-primary-500/90 px-300 py-200 font-accent text-sm font-semibold text-neutral-0 shadow-widget backdrop-blur-xl transition-colors hover:bg-primary-600">
            <span>Nouveau plan de course</span>
            <Plus className="size-5 shrink-0" strokeWidth={2.5} />
          </button>
        </section>
        {/* ── Bento stats ── */}
        <section className="grid grid-cols-2 gap-150 lg:grid-cols-3 lg:gap-200">

          {/* Km semaine */}
          <div className="widget-card flex flex-col justify-between p-300">
            <p className="widget-label">
              Cette semaine
            </p>
            <div className="mt-200">
              <p className="font-heading text-4xl font-extrabold text-primary-700">
                42
                <span className="ml-50 text-lg font-medium text-neutral-400"> km</span>
              </p>
              <div className="mt-150 flex items-center gap-75 font-accent text-[11px] font-medium text-secondary-500">
                <TrendingUp className="size-3.5 shrink-0" strokeWidth={2.5} />
                +12 % vs semaine passée
              </div>
            </div>
          </div>

          {/* Dénivelé */}
          <div className="widget-card flex flex-col justify-between p-300">
            <p className="widget-label">
              Dénivelé
            </p>
            <div className="mt-200">
              <p className="font-heading text-4xl font-extrabold text-primary-700">
                1 840
                <span className="ml-50 text-lg font-medium text-neutral-400"> m</span>
              </p>
              <div className="mt-150 flex items-center gap-75 font-accent text-[11px] font-medium text-neutral-400">
                <Mountain className="size-3.5 shrink-0" strokeWidth={2} />
                D+ cumulé
              </div>
            </div>
          </div>

          {/* Prochain objectif — spanning 2 rows sur desktop */}
          <div className="widget-card-secondary col-span-2 flex flex-col justify-between p-300 lg:col-span-1 lg:row-span-2">
            <div>
              <p className="widget-label">
                Prochain objectif
              </p>
              <h2 className="mt-200 font-heading text-3xl font-extrabold leading-none text-neutral-0">
                UTMB<br />
                <span className="text-primary-400">CCC</span>
              </h2>
              <div className="mt-200 flex items-center gap-100 font-accent text-sm font-semibold text-neutral-50">
                <MapPin className="size-4 shrink-0" strokeWidth={1.75} />
                Chamonix · 100 km · 6 000 m D+
              </div>
            </div>
            <div className="mt-400 pt-300">
              <p className="widget-label">
                Compte à rebours
              </p>
              <p className="mt-100 font-heading text-5xl font-extrabold text-neutral-0">
                J–61
              </p>
              <p className="mt-75 font-accent text-sm font-semibold text-neutral-50">23 août 2026</p>
            </div>
          </div>

          {/* Sorties ce mois */}
          <div className="widget-card flex flex-col justify-between p-300">
            <p className="widget-label">
              Ce mois
            </p>
            <div className="mt-200">
              <p className="font-heading text-4xl font-extrabold text-primary-700">
                3
                <span className="ml-50 text-lg font-medium text-neutral-400"> sorties</span>
              </p>
              <div className="mt-150 flex items-center gap-75 font-accent text-[11px] font-medium text-neutral-400">
                <Flame className="size-3.5 shrink-0" strokeWidth={2} />
                Objectif : 8 ce mois
              </div>
            </div>
          </div>

          {/* Allure moyenne */}
          <div className="widget-card flex flex-col justify-between p-300">
            <p className="widget-label">
              Allure moy.
            </p>
            <div className="mt-200">
              <p className="font-heading text-4xl font-extrabold text-primary-700">
                6:12
                <span className="ml-50 text-lg font-medium text-neutral-400"> /km</span>
              </p>
              <div className="mt-150 flex items-center gap-75 font-accent text-[11px] font-medium text-neutral-400">
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
            <button className="font-accent text-xs font-medium text-secondary-500 hover:text-secondary-700 transition-colors">
              Voir tout
            </button>
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
                <p className="font-accent text-sm font-semibold text-neutral-800">{run.label}</p>
                <p className="mt-25 font-body text-xs text-neutral-80">{run.date}</p>
              </div>
              <div className="flex items-center gap-200 text-right">
                <div>
                  <p className="font-heading text-base font-bold text-primary-700">{run.km}</p>
                  <p className="font-accent text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                    <Mountain className="size-3 shrink-0" strokeWidth={2} />
                    {run.d}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-base font-bold text-neutral-4000">{run.time}</p>
                  <p className="font-accent text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
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
