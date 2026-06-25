import { Trophy, MapPin, Clock, Mountain, ChevronRight, Plus } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

const plans = [
  {
    name: 'UTMB CCC',
    location: 'Chamonix',
    date: '23 août 2026',
    distance: '100 km',
    elevation: '6 000 m D+',
    status: 'En cours',
    daysLeft: 61,
  },
  {
    name: "Maxi-Race du Lac d'Annecy",
    location: 'Annecy',
    date: '15 mai 2027',
    distance: '85 km',
    elevation: '5 500 m D+',
    status: 'Planifié',
    daysLeft: 324,
  },
  {
    name: 'Grand Raid des Pyrénées',
    location: 'Luz-Saint-Sauveur',
    date: '27 août 2027',
    distance: '80 km',
    elevation: '5 200 m D+',
    status: 'Planifié',
    daysLeft: 428,
  },
]

export default function RacePlans() {
  return (
    <AppLayout activeItem="plans" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* Header */}
        <section className="pt-100">
          <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-90">
            Compétitions · Objectifs
          </p>
          <h1 className="mt-150 font-heading text-[2.6rem] font-extrabold leading-tight text-neutral-800 lg:text-5xl">
            Plans de course
          </h1>
          <p className="mt-150 font-body text-base text-neutral-80">
            Tes prochaines courses et les plans d'entraînement associés.
          </p>
        </section>

        {/* CTA */}
        <button className="flex w-full items-center justify-between rounded-2xl bg-secondary-500/90 px-300 py-200 font-accent text-sm font-semibold text-neutral-0 shadow-widget backdrop-blur-xl transition-colors hover:bg-secondary-600">
          <span>Ajouter une course</span>
          <Plus className="size-5 shrink-0" strokeWidth={2.5} />
        </button>

        {/* Plans list */}
        <section className="widget-card overflow-hidden p-100">
          {plans.map((plan, i) => (
            <div
              key={i}
              className="widget-row flex cursor-pointer items-center justify-between px-200 py-200"
            >
              <div className="flex items-start gap-200">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100/80">
                  <Trophy className="size-5 text-secondary-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="widget-title">{plan.name}</p>
                  <div className="mt-75 flex flex-wrap items-center gap-x-200 gap-y-50">
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
              <div className="flex items-center gap-200 shrink-0 ml-200">
                <div className="text-right">
                  <span className={[
                    'inline-block rounded-full px-150 py-25 font-accent text-[10px] font-semibold',
                    plan.status === 'En cours'
                      ? 'bg-secondary-100 text-secondary-700'
                      : 'bg-neutral-20 text-neutral-500',
                  ].join(' ')}>
                    {plan.status}
                  </span>
                  <p className="mt-50 font-heading text-base font-bold text-primary-700">J–{plan.daysLeft}</p>
                </div>
                <ChevronRight className="size-5 text-neutral-40 shrink-0" />
              </div>
            </div>
          ))}
        </section>

      </div>
    </AppLayout>
  )
}
