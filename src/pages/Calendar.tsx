import { Mountain, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const sessions: { day: number; color: string }[] = [
  { day: 2,  color: 'bg-primary-500' },
  { day: 5,  color: 'bg-primary-400' },
  { day: 9,  color: 'bg-primary-300' },
  { day: 12, color: 'bg-primary-500' },
  { day: 16, color: 'bg-primary-400' },
  { day: 19, color: 'bg-primary-500' },
  { day: 26, color: 'bg-primary-500' },
]

const sessionByDay: Record<number, string> = {}
sessions.forEach(s => { sessionByDay[s.day] = s.color })

const TODAY = 25
const START_OFFSET = 6 // juillet 2026 commence un dimanche (offset 6)
const DAYS_IN_MONTH = 30

const cells: (number | null)[] = [
  ...Array(START_OFFSET).fill(null),
  ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
]
while (cells.length % 7 !== 0) cells.push(null)

const upcoming = [
  { date: 'Mer. 25 juin', label: 'Sortie longue — Belledonne', km: '28 km', d: '1 420 m' },
  { date: 'Sam. 28 juin', label: 'Fractionné trail',            km: '12 km', d: '340 m' },
  { date: 'Lun. 30 juin', label: 'Récupération active',         km: '8 km',  d: '110 m' },
]

export default function Calendar() {
  return (
    <AppLayout activeItem="calendrier" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* Header */}
        <section className="pt-100">
          <p className="text-[11px] eyebrow text-neutral-90">
            Planning · Entraînement
          </p>
          <h1 className="mt-150 text-[42px] font-extrabold leading-tight text-neutral-800 lg:text-[48px]">
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

          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <div key={week} className="grid grid-cols-7">
              {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
                const dotColor = day ? sessionByDay[day] : undefined
                const isToday = day === TODAY
                return (
                  <div
                    key={col}
                    className={[
                      'relative flex flex-col items-center gap-50 rounded-2xl py-200',
                      day ? 'cursor-pointer transition-colors hover:bg-neutral-0/45' : '',
                    ].join(' ')}
                  >
                    {day && (
                      <>
                        <span className={[
                          'text-[12px] font-semibold',
                          isToday
                            ? 'flex size-6 items-center justify-center rounded-full bg-primary-500 text-neutral-0'
                            : 'text-neutral-600',
                        ].join(' ')}>
                          {day}
                        </span>
                        {dotColor && <span className={`size-1.5 rounded-full ${dotColor}`} />}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </section>

        {/* Upcoming sessions */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Prochaines séances</p>
            <button className="btn btn-text flex items-center gap-75 text-[12px]">
              <Plus className="size-3.5 shrink-0" strokeWidth={2.5} />
              Ajouter
            </button>
          </div>
          {upcoming.map((s, i) => (
            <div key={i} className="widget-row flex cursor-pointer items-center justify-between px-200 py-200">
              <div>
                <p className="text-[14px] font-semibold text-neutral-800">{s.label}</p>
                <p className="mt-25 text-[12px] text-neutral-80">{s.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-bold text-primary-700">{s.km}</p>
                <p className="text-[10px] text-neutral-80 flex items-center gap-50 justify-end">
                  <Mountain className="size-3 shrink-0" strokeWidth={2} />
                  {s.d}
                </p>
              </div>
            </div>
          ))}
        </section>

      </div>
    </AppLayout>
  )
}
