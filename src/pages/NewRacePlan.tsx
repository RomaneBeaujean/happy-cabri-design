import { useState } from 'react'
import { Upload, FileText, X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import Stepper, { type StepConfig } from '../components/Stepper'
import AltimetryChart, { type AltimetryPoint } from '../components/AltimetryChart'

const STEPS: StepConfig[] = [
  { label: 'Import GPX' },
  { label: 'Infos course' },
  { label: 'Confirmation' },
]

// Données GPX simulées — à remplacer par le parsing réel du fichier
const MOCK_GPX_DATA: AltimetryPoint[] = [
  { km: 0,   alt: 180 }, { km: 4,   alt: 620 }, { km: 8,   alt: 1400 },
  { km: 12,  alt: 2100 }, { km: 15,  alt: 2480 }, { km: 18,  alt: 1700 },
  { km: 22,  alt: 900 },  { km: 26,  alt: 1600 }, { km: 30,  alt: 2300 },
  { km: 34,  alt: 2700 }, { km: 37,  alt: 2200 }, { km: 41,  alt: 1300 },
  { km: 45,  alt: 600 },  { km: 49,  alt: 400 },  { km: 53,  alt: 900 },
  { km: 57,  alt: 1800 }, { km: 61,  alt: 2400 }, { km: 65,  alt: 2874 },
  { km: 68,  alt: 2500 }, { km: 72,  alt: 1600 }, { km: 76,  alt: 800 },
  { km: 80,  alt: 300 },  { km: 84,  alt: 700 },  { km: 88,  alt: 1500 },
  { km: 92,  alt: 2200 }, { km: 96,  alt: 2600 }, { km: 100, alt: 2874 },
  { km: 103, alt: 2300 }, { km: 107, alt: 1500 }, { km: 111, alt: 700 },
  { km: 115, alt: 1100 }, { km: 119, alt: 2000 }, { km: 123, alt: 2500 },
  { km: 127, alt: 2800 }, { km: 130, alt: 2400 }, { km: 134, alt: 1600 },
  { km: 138, alt: 900 },  { km: 142, alt: 1400 }, { km: 146, alt: 2100 },
  { km: 150, alt: 2600 }, { km: 154, alt: 2874 }, { km: 158, alt: 2200 },
  { km: 162, alt: 1400 }, { km: 166, alt: 600 },  { km: 171, alt: 180 },
]

// Positions km des séparations de segments (24 segments)
const MOCK_SEGMENT_KMS = [7, 14, 22, 30, 37, 45, 53, 61, 68, 76, 84, 92, 100, 107, 115, 123, 130, 138, 146, 154, 158, 162, 166]

const MOCK_GPX_STATS = {
  filename: 'grand-raid-reunion-2027.gpx',
  size: '2,4 Mo',
  distance: 171,
  elevationGain: 10060,
  elevationLoss: 10060,
  highPoint: 2874,
  segments: 24,
}

export default function NewRacePlan() {
  const [step, setStep] = useState(0)
  const [gpxLoaded, setGpxLoaded] = useState(false)

  // Étape 2 — état du formulaire
  const [raceName,     setRaceName]     = useState('Grand Raid de La Réunion')
  const [raceLocation, setRaceLocation] = useState('La Réunion')
  const [raceDate,     setRaceDate]     = useState('2027-08-04')
  const [raceTime,     setRaceTime]     = useState('10:00')
  const [hasTarget,    setHasTarget]    = useState(true)
  const [pace,         setPace]         = useState('9:20')

  const goBack = () => {
    if (step === 0) {
      window.history.pushState({}, '', '/plans')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else {
      setStep(s => s - 1)
    }
  }

  return (
    <AppLayout activeItem="plans" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <h1 className="text-[2.6rem] font-extrabold leading-tight text-neutral-800 lg:text-5xl">
            Nouveau plan
          </h1>
          {/* Stepper desktop — sous le titre, centré */}
          <div className="mt-300 hidden lg:flex lg:justify-center">
            <Stepper steps={STEPS} current={step} />
          </div>
        </section>

        {/* Stepper mobile — barre de progression simple */}
        <div className="lg:hidden">
          <div className="flex gap-100">
            {STEPS.map((_, i) => (
              <div key={i} className={[
                'h-[3px] flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary-500' : 'bg-neutral-20',
              ].join(' ')} />
            ))}
          </div>
          <p className="mt-100 mb-150 text-[11px] font-semibold text-primary-700">
            Étape {step + 1} sur {STEPS.length} — {STEPS[step].label}
          </p>
        </div>

        {/* ── Contenu de l'étape ── */}
        {step === 0 && <Step1 gpxLoaded={gpxLoaded} onLoad={() => setGpxLoaded(true)} onRemove={() => setGpxLoaded(false)} />}
        {step === 1 && (
          <Step2
            raceName={raceName}         setRaceName={setRaceName}
            raceLocation={raceLocation} setRaceLocation={setRaceLocation}
            raceDate={raceDate}         setRaceDate={setRaceDate}
            raceTime={raceTime}         setRaceTime={setRaceTime}
            hasTarget={hasTarget}       setHasTarget={setHasTarget}
            pace={pace}                 setPace={setPace}
          />
        )}
        {step === 2 && <Step3 raceName={raceName} raceLocation={raceLocation} raceDate={raceDate} raceTime={raceTime} pace={pace} />}

        {/* ── Footer navigation ── */}
        <div className="flex items-center justify-between pb-300">
          <button className="btn btn-primary flex items-center gap-100 bg-transparent text-neutral-500 shadow-none hover:bg-transparent hover:text-neutral-800" onClick={goBack}>
            <ChevronLeft className="size-4" strokeWidth={2.5} />
            {step === 0 ? 'Retour aux plans' : 'Retour'}
          </button>

          {step < 2 ? (
            <button
              className={[
                'btn btn-primary flex items-center gap-150',
                step === 0 && !gpxLoaded ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
              disabled={step === 0 && !gpxLoaded}
              onClick={() => setStep(s => s + 1)}
            >
              Suivant
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button className="btn btn-primary flex items-center gap-150">
              <Sparkles className="size-4" strokeWidth={2} />
              Générer le plan
            </button>
          )}
        </div>

      </div>
    </AppLayout>
  )
}

/* ─────────────────────────────────────────
   Étape 1 — Import GPX
───────────────────────────────────────── */
function Step1({ gpxLoaded, onLoad, onRemove }: {
  gpxLoaded: boolean
  onLoad: () => void
  onRemove: () => void
}) {
  return (
    <section className="space-y-300">
      <div>
        <h2 className="text-xl font-extrabold text-neutral-800">Importez votre trace</h2>
        <p className="mt-75 text-sm text-neutral-90">
          {gpxLoaded
            ? 'Trace analysée — vérifiez les données avant de continuer.'
            : 'Chargez le fichier GPX de votre course. La trace sera découpée automatiquement en segments.'}
        </p>
      </div>

      {!gpxLoaded ? (
        /* Dropzone vide */
        <div
          onClick={onLoad}
          className="widget-card flex cursor-pointer flex-col items-center gap-200 px-300 py-[52px] transition-colors hover:bg-white/80"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-50">
            <Upload className="size-5 text-primary-500" strokeWidth={2} />
          </div>
          <div className="text-center">
            <p className="text-sm font-extrabold text-neutral-800">Déposez votre fichier GPX ici</p>
            <p className="mt-75 text-xs text-neutral-90">
              Glissez-déposez depuis votre explorateur, ou sélectionnez-le manuellement.
            </p>
          </div>
          <button className="btn btn-primary mt-100">Choisir un fichier</button>
          <p className="text-[11px] text-neutral-60">Formats acceptés : .gpx · Taille max 10 Mo</p>
        </div>
      ) : (
        /* Aperçu GPX chargé */
        <div className="widget-card overflow-hidden">
          {/* Fichier info */}
          <div className="flex items-center justify-between border-b border-neutral-20 px-300 py-200">
            <div className="flex items-center gap-200">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-50">
                <FileText className="size-4 text-primary-500" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-800">{MOCK_GPX_STATS.filename}</p>
                <p className="text-[11px] text-neutral-60">{MOCK_GPX_STATS.size}</p>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="btn btn-ghost flex items-center gap-75 text-[11px] text-neutral-60 hover:text-neutral-800"
            >
              <X className="size-3.5" strokeWidth={2} />
              Supprimer
            </button>
          </div>

          {/* Graphique altimétrique */}
          <div className="px-300 pb-200 pt-200">
            <p className="mb-150 text-[10px] eyebrow text-neutral-80">
              Profil altimétrique
            </p>
            <AltimetryChart data={MOCK_GPX_DATA} height={220} />
          </div>

          {/* Stats */}
          <div className="flex divide-x divide-neutral-20 border-t border-neutral-20">
            {[
              { label: 'Distance',   value: `${MOCK_GPX_STATS.distance}`, unit: 'km' },
              { label: 'D+',         value: `${MOCK_GPX_STATS.elevationGain.toLocaleString('fr')}`, unit: 'm' },
              { label: 'D−',         value: `${MOCK_GPX_STATS.elevationLoss.toLocaleString('fr')}`, unit: 'm' },
              { label: 'Point haut', value: `${MOCK_GPX_STATS.highPoint.toLocaleString('fr')}`, unit: 'm' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="flex flex-1 flex-col items-center px-100 py-200 text-center">
                <p className="whitespace-nowrap text-[9px] eyebrow text-neutral-80 lg:text-[10px]">{label}</p>
                <p className="mt-50 whitespace-nowrap text-sm font-extrabold text-primary-600 lg:text-lg">
                  {value} <span className="text-[10px] font-medium text-neutral-90 lg:text-xs">{unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────────────────────────
   Étape 2 — Infos course
───────────────────────────────────────── */
function Step2({
  raceName, setRaceName,
  raceLocation, setRaceLocation,
  raceDate, setRaceDate,
  raceTime, setRaceTime,
  hasTarget, setHasTarget,
  pace, setPace,
}: {
  raceName: string;     setRaceName: (v: string) => void
  raceLocation: string; setRaceLocation: (v: string) => void
  raceDate: string;     setRaceDate: (v: string) => void
  raceTime: string;     setRaceTime: (v: string) => void
  hasTarget: boolean;   setHasTarget: (v: boolean) => void
  pace: string;         setPace: (v: string) => void
}) {
  const [focused, setFocused] = useState<string | null>(null)

  const inputCls = () => 'input'

  const labelCls = (id: string) =>
    `text-xs font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-500'}`

  const convInputCls = (id: string, _readonly: boolean) => [
    'input pl-150 pr-[44px]',
    focused === id ? 'bg-primary-50/60 font-semibold' : '',
  ].filter(Boolean).join(' ')

  const convLabelCls = (id: string) =>
    `text-[10px] font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-80'}`

  return (
    <section className="space-y-150 lg:space-y-300">
      <h2 className="text-xl font-extrabold text-neutral-800">Votre course</h2>

      {/* Champs course — espacement réduit entre chaque champ */}
      <div className="space-y-100">
        <div className="space-y-100">
          <label className={labelCls('name')}>Nom de la course</label>
          <input className={inputCls()} type="text" value={raceName}
            onChange={e => setRaceName(e.target.value)}
            onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />
        </div>

        <div className="space-y-100">
          <label className={labelCls('location')}>Lieu</label>
          <input className={inputCls()} type="text" value={raceLocation}
            onChange={e => setRaceLocation(e.target.value)}
            onFocus={() => setFocused('location')} onBlur={() => setFocused(null)} />
        </div>

        <div className="grid grid-cols-2 gap-100">
          <div className="space-y-100">
            <label className={labelCls('date')}>Date de la course</label>
            <input className={inputCls()} type="date" value={raceDate}
              onChange={e => setRaceDate(e.target.value)}
              onFocus={() => setFocused('date')} onBlur={() => setFocused(null)} />
          </div>
          <div className="space-y-100">
            <label className={labelCls('time')}>Heure de départ</label>
            <input className={inputCls()} type="time" value={raceTime}
              onChange={e => setRaceTime(e.target.value)}
              onFocus={() => setFocused('time')} onBlur={() => setFocused(null)} />
          </div>
        </div>
      </div>

      {/* Objectif de temps */}
      <div className="widget-card overflow-hidden">
        <div className="flex items-center justify-between px-300 py-200">
          <div>
            <p className="text-sm font-bold text-neutral-800">Objectif de temps</p>
            <p className="mt-50 text-[11px] text-neutral-90">
              Sans objectif, le cabri-bot estime à partir de votre profil coureur
            </p>
          </div>
          <button
            role="switch"
            aria-checked={hasTarget}
            onClick={() => setHasTarget(!hasTarget)}
            className={[
              'relative h-[22px] w-10 shrink-0 rounded-full transition-colors',
              hasTarget ? 'bg-primary-500' : 'bg-neutral-40',
            ].join(' ')}
          >
            <span className={[
              'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-transform',
              hasTarget ? 'left-[3px] translate-x-[18px]' : 'left-[3px]',
            ].join(' ')} />
          </button>
        </div>

        {hasTarget && (
          <div className="space-y-200 border-t border-neutral-20 px-300 py-200">
            <div className="grid grid-cols-3 gap-150">
              {[
                { id: 'pace',     label: 'Allure moyenne', value: pace,      unit: 'min/km', readonly: false, onChange: setPace },
                { id: 'duration', label: 'Durée totale',   value: '26h 36m', unit: 'h',      readonly: true },
                { id: 'keph',     label: 'km-effort/h',    value: '6,4',     unit: 'ke/h',   readonly: true },
              ].map(({ id, label, value, unit, readonly, onChange }) => (
                <div key={id} className="space-y-75">
                  <p className={convLabelCls(id)}>{label}</p>
                  <div className="relative">
                    <input
                      className={convInputCls(id, readonly)}
                      readOnly={readonly}
                      value={value}
                      onChange={onChange ? e => onChange(e.target.value) : undefined}
                      onFocus={() => setFocused(id)}
                      onBlur={() => setFocused(null)}
                    />
                    <span className="absolute right-150 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-60">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold text-primary-600">
              1 km-effort = 1 km plat ou 100 m de D+
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Étape 3 — Confirmation
───────────────────────────────────────── */
function Step3({ raceName, raceLocation, raceDate, raceTime, pace }: {
  raceName: string
  raceLocation: string
  raceDate: string
  raceTime: string
  pace: string
}) {
  const formattedDate = new Date(raceDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <section className="space-y-300">
      <div>
        <h2 className="text-xl font-extrabold text-neutral-800">Tout est prêt</h2>
        <p className="mt-75 text-sm text-neutral-90">Vérifiez les informations avant de générer votre plan.</p>
      </div>

      {/* Recap card */}
      <div className="widget-card overflow-hidden">
        {/* Mini altimétrie + titre */}
        <div className="border-b border-neutral-20 px-300 pb-200 pt-200">
          <p className="text-base font-extrabold text-neutral-900">{raceName}</p>
          <p className="mt-75 text-[10px] eyebrow text-neutral-80">
            {formattedDate} · {raceLocation} · Départ {raceTime}
          </p>
          <div className="mt-150">
            <AltimetryChart data={MOCK_GPX_DATA} height={160} segments={MOCK_SEGMENT_KMS} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex divide-x divide-neutral-20 border-b border-neutral-20">
          {[
            { label: 'Distance', value: `${MOCK_GPX_STATS.distance}`,                           unit: 'km' },
            { label: 'D+',       value: `${MOCK_GPX_STATS.elevationGain.toLocaleString('fr')}`, unit: 'm' },
            { label: 'Segments', value: `${MOCK_GPX_STATS.segments}`,                           unit: 'seg.' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="flex flex-1 flex-col items-center px-100 py-150 text-center">
              <p className="whitespace-nowrap text-[9px] eyebrow text-neutral-80 lg:text-[10px]">{label}</p>
              <p className="mt-50 whitespace-nowrap text-sm font-extrabold text-primary-600 lg:text-lg">
                {value}{unit && <span className="text-[10px] font-medium text-neutral-90 lg:text-xs"> {unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Objectif + Allure */}
        <div className="flex divide-x divide-neutral-20">
          <div className="flex w-1/3 flex-col items-center py-150 text-center">
            <span className="text-[9px] eyebrow text-neutral-80 lg:text-[10px]">Objectif</span>
            <span className="mt-50 whitespace-nowrap text-sm font-extrabold text-accent-500 lg:text-lg">
              26h 36m
            </span>
          </div>
          <div className="flex w-2/3 flex-col items-center py-150 text-center">
            <span className="text-[9px] eyebrow text-neutral-80 lg:text-[10px]">Allure moyenne</span>
            <span className="mt-50 whitespace-nowrap text-sm font-extrabold text-accent-500 lg:text-lg">
              {pace} <span className="text-[10px] font-medium text-neutral-90 lg:text-xs">min/km</span> · 6,4 <span className="text-[10px] font-medium text-neutral-90 lg:text-xs">ke/h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bot notice */}
      <div className="flex gap-200 rounded-2xl border border-primary-100 bg-primary-50/60 px-300 py-200">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500">
          <Sparkles className="size-4 text-neutral-0" strokeWidth={2} />
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Le Cabri-Bot va calculer, pour chacun des {MOCK_GPX_STATS.segments} segments, une allure personnalisée basée sur le terrain et la pente, vos aptitudes et votre objectif de 26h 36m. Tout sera librement ajustable ensuite.
        </p>
      </div>
    </section>
  )
}
