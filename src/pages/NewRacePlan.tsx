import { useState } from 'react'
import { Upload, FileText, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Sparkles, Plus, Clock } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import Stepper, { type StepConfig } from '../components/Stepper'
import AltimetryChart, { type AltimetryPoint } from '../components/AltimetryChart'
import { buildInitialData } from './RacePlan/mockData'
import { ALT_DATA } from './RacePlan/trackData'
import { deriveSegments } from './RacePlan/segmentModel'
import { paceToSec, secToPace, fmtTime, sanitizeQtyInput, sanitizeTimeInput, normalizeTimeInput } from './RacePlan/format'
import { initAllures } from './RunnerProfile'

const STEPS: StepConfig[] = [
  { label: 'Import GPX' },
  { label: 'Infos course' },
  { label: 'Objectif' },
  { label: 'Confirmation' },
]

// ── Données GPX — trace réelle "Luchon Aneto Trail 2025", même source que le plan de course existant ──
const LUCHON = buildInitialData()
const LUCHON_SEGMENTS = deriveSegments(LUCHON.cutPoints, LUCHON.segmentData, ALT_DATA)

const MOCK_GPX_DATA: AltimetryPoint[] = ALT_DATA

// Séparateurs internes (hors départ/arrivée)
const MOCK_SEPARATORS: number[] = LUCHON_SEGMENTS.slice(0, -1).map(seg => seg.to)

const LUCHON_RAVITO_ENTRIES = LUCHON.cutPoints
  .filter(cp => LUCHON.ravitoIds.has(cp.id))
  .sort((a, b) => a.km - b.km)
  .map(cp => ({
    km: cp.km,
    stopMin: LUCHON.ravitoStops[cp.id] ?? '',
    cutoff: LUCHON.cutoffTimes[cp.id] ?? '',
  }))

const TOTAL_KM = LUCHON_SEGMENTS[LUCHON_SEGMENTS.length - 1].to
const TOTAL_DP = LUCHON_SEGMENTS.reduce((sum, seg) => sum + seg.dp, 0)
const TOTAL_DM = LUCHON_SEGMENTS.reduce((sum, seg) => sum + seg.dm, 0)
const HIGH_POINT = Math.max(...ALT_DATA.map(p => p.alt))
const TOTAL_KM_EFFORT = TOTAL_KM + TOTAL_DP / 100

function raceCategory(km: number): 'courte' | 'longue' | 'ultra' {
  if (km < 25) return 'courte'
  if (km <= 60) return 'longue'
  return 'ultra'
}

// Estimation du temps de course à partir du profil coureur (allures du profil, catégorie de distance)
const ESTIMATED_KEPH = parseFloat((initAllures.find(a => a.id === raceCategory(TOTAL_KM))?.kmEffort ?? '8').replace(',', '.'))
const ESTIMATED_MINS = Math.round((TOTAL_KM_EFFORT / ESTIMATED_KEPH) * 60)
const ESTIMATED_PACE_SEC = Math.round((ESTIMATED_MINS * 60) / TOTAL_KM)

const MOCK_GPX_STATS = {
  filename: 'luchon-aneto-trail-2025.gpx',
  size: '4,2 Mo',
  distance: TOTAL_KM,
  elevationGain: TOTAL_DP,
  elevationLoss: TOTAL_DM,
  highPoint: HIGH_POINT,
  segments: LUCHON_SEGMENTS.length,
}

interface RavitoEntry {
  id: string
  km: string
  stopMin: string
  stopTouched: boolean
  cutoff: string
}

function seedRavitos(): RavitoEntry[] {
  return LUCHON_RAVITO_ENTRIES.map((r, i) => ({
    id: `ravito-${i}`,
    km: String(r.km),
    stopMin: r.stopMin,
    stopTouched: true,
    cutoff: r.cutoff,
  }))
}

export default function NewRacePlan() {
  const [step, setStep] = useState(0)
  const [gpxLoaded, setGpxLoaded] = useState(false)

  // Étape 2 — infos course
  const [raceName,     setRaceName]     = useState('Luchon Aneto Trail 2025')
  const [raceLocation, setRaceLocation] = useState('Luchon')
  const [raceDate,     setRaceDate]     = useState('2025-11-13')
  const [raceTime,     setRaceTime]     = useState('04:00')

  // Étape 2 — ravitaillements
  const [ravitosEnabled, setRavitosEnabled] = useState(false)
  const [ravitos,        setRavitos]        = useState<RavitoEntry[]>([])

  // Étape 3 — objectif de temps
  const [customTarget, setCustomTarget] = useState(false)
  const [durationMins, setDurationMins] = useState(ESTIMATED_MINS)

  function toggleRavitos() {
    setRavitosEnabled(v => {
      const next = !v
      if (next && ravitos.length === 0) setRavitos(seedRavitos())
      return next
    })
  }
  function addRavito() {
    const firstStop = ravitos[0]?.stopMin ?? ''
    setRavitos(rs => [...rs, { id: crypto.randomUUID(), km: '', stopMin: firstStop, stopTouched: false, cutoff: '' }])
  }
  function removeRavito(id: string) {
    setRavitos(rs => rs.filter(r => r.id !== id))
  }
  function updateRavitoKm(id: string, km: string) {
    setRavitos(rs => rs.map(r => r.id === id ? { ...r, km } : r))
  }
  /** Édition du temps d'arrêt — si c'est le 1er ravito, propage la valeur aux autres pas encore renseignés. */
  function updateRavitoStop(id: string, value: string) {
    setRavitos(rs => {
      const idx = rs.findIndex(r => r.id === id)
      if (idx === -1) return rs
      const isFirst = idx === 0
      return rs.map(r => {
        if (r.id === id) return { ...r, stopMin: value, stopTouched: true }
        if (isFirst && !r.stopTouched) return { ...r, stopMin: value }
        return r
      })
    })
  }
  function updateRavitoCutoff(id: string, value: string) {
    setRavitos(rs => rs.map(r => r.id === id ? { ...r, cutoff: value } : r))
  }

  const goBack = () => {
    if (step === 0) {
      window.history.pushState({}, '', '/plans')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else {
      setStep(s => s - 1)
    }
  }

  const finalDurationMins = customTarget ? durationMins : ESTIMATED_MINS
  const validRavitoKms = ravitos
    .map(r => parseFloat(r.km.replace(',', '.')))
    .filter(n => Number.isFinite(n) && n > 0 && n < TOTAL_KM)

  return (
    <AppLayout activeItem="plans" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <h1 className="text-[42px] font-extrabold leading-tight text-neutral-800 lg:text-[48px]">
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
            ravitosEnabled={ravitosEnabled} onToggleRavitos={toggleRavitos}
            ravitos={ravitos}
            onAddRavito={addRavito}
            onRemoveRavito={removeRavito}
            onRavitoKmChange={updateRavitoKm}
            onRavitoStopChange={updateRavitoStop}
            onRavitoCutoffChange={updateRavitoCutoff}
          />
        )}
        {step === 2 && (
          <Step3Objectif
            customTarget={customTarget} setCustomTarget={setCustomTarget}
            durationMins={durationMins} setDurationMins={setDurationMins}
          />
        )}
        {step === 3 && (
          <Step4Confirmation
            raceName={raceName} raceLocation={raceLocation} raceDate={raceDate} raceTime={raceTime}
            finalDurationMins={finalDurationMins}
            ravitoKms={ravitosEnabled ? validRavitoKms : []}
          />
        )}

        {/* ── Footer navigation ── */}
        <div className="flex items-center justify-between pb-300">
          <button className="btn btn-text" onClick={goBack}>
            <ChevronLeft className="size-4" strokeWidth={2.5} />
            {step === 0 ? 'Retour aux plans' : 'Retour'}
          </button>

          {step < 3 ? (
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
            <button
              className="btn btn-primary flex items-center gap-150"
              onClick={() => {
                window.history.pushState({}, '', '/plans/1')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
            >
              <Sparkles className="size-4" strokeWidth={2} />
              Générer le plan
            </button>
          )}
        </div>

      </div>
    </AppLayout>
  )
}

/** Switch toggle standard — réutilisé pour "Ravitaillements" et "Définir mon propre objectif". */
function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        'relative h-[22px] w-10 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary-500' : 'bg-neutral-40',
      ].join(' ')}
    >
      <span className={[
        'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'left-[3px] translate-x-[18px]' : 'left-[3px]',
      ].join(' ')} />
    </button>
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
        <h2 className="text-[20px] font-extrabold text-neutral-800">Importez votre trace</h2>
        <p className="mt-75 text-[14px] text-neutral-90">
          {gpxLoaded
            ? 'Vérifiez les données avant de continuer'
            : 'Chargez le fichier GPX de votre course. La trace sera découpée automatiquement en segments.'}
        </p>
      </div>

      {!gpxLoaded ? (
        /* Dropzone vide */
        <div
          onClick={onLoad}
          className="widget-card flex cursor-pointer flex-col items-center gap-200 px-300 py-[52px] transition-colors hover:bg-white/80"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-500">
            <Upload className="size-5 text-neutral-0" strokeWidth={2} />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-extrabold text-neutral-800">Déposez votre fichier GPX ici</p>
            <p className="mt-75 text-[12px] text-neutral-90">
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-500">
                <FileText className="size-4 text-neutral-0" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-neutral-800">{MOCK_GPX_STATS.filename}</p>
                <p className="text-[11px] text-neutral-60">{MOCK_GPX_STATS.size}</p>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="btn btn-text"
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
                <p className="mt-50 whitespace-nowrap text-[14px] font-extrabold text-primary-600 lg:text-[18px]">
                  {value} <span className="text-[10px] font-medium text-neutral-90 lg:text-[12px]">{unit}</span>
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
  ravitosEnabled, onToggleRavitos,
  ravitos, onAddRavito, onRemoveRavito,
  onRavitoKmChange, onRavitoStopChange, onRavitoCutoffChange,
}: {
  raceName: string;     setRaceName: (v: string) => void
  raceLocation: string; setRaceLocation: (v: string) => void
  raceDate: string;     setRaceDate: (v: string) => void
  raceTime: string;     setRaceTime: (v: string) => void
  ravitosEnabled: boolean
  onToggleRavitos: () => void
  ravitos: RavitoEntry[]
  onAddRavito: () => void
  onRemoveRavito: (id: string) => void
  onRavitoKmChange: (id: string, km: string) => void
  onRavitoStopChange: (id: string, v: string) => void
  onRavitoCutoffChange: (id: string, v: string) => void
}) {
  const [focused, setFocused] = useState<string | null>(null)

  const inputCls = () => 'input'
  const labelCls = (id: string) =>
    `text-[12px] font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-500'}`
  const smallLabelCls = (id: string) =>
    `text-[10px] font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-80'}`

  return (
    <section className="space-y-150 lg:space-y-300">
      <h2 className="text-[20px] font-extrabold text-neutral-800">Informations sur votre course</h2>

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

      {/* Ravitaillements */}
      <div className="widget-card overflow-hidden">
        <div className="flex items-center justify-between px-300 py-200">
          <div>
            <p className="text-[14px] font-bold text-neutral-800">Ravitaillements</p>
            <p className="mt-50 text-[11px] text-neutral-90">
              Indiquez à quelle distance se situent vos ravitaillements, avec temps d'arrêt et barrière horaire facultative.
            </p>
          </div>
          <SwitchToggle checked={ravitosEnabled} onChange={onToggleRavitos} />
        </div>

        {ravitosEnabled && (
          <div className="space-y-150 border-t border-neutral-20 px-300 py-200">
            {ravitos.length === 0 && (
              <p className="text-[12px] text-neutral-90">Aucun ravitaillement pour l'instant.</p>
            )}

            {ravitos.map((r, i) => (
              <div key={r.id} className="space-y-100 rounded-xl bg-neutral-10/60 p-150">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-primary-700">Ravito {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveRavito(r.id)}
                    className="flex size-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-20 hover:text-red-500"
                    aria-label="Supprimer ce ravitaillement"
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-100 lg:grid-cols-3">
                  <div className="space-y-75">
                    <label className={smallLabelCls(`km-${r.id}`)}>Distance</label>
                    <div className="relative">
                      <input
                        className="input pr-[40px]"
                        inputMode="decimal"
                        value={r.km}
                        placeholder="0"
                        onChange={e => onRavitoKmChange(r.id, sanitizeQtyInput(e.target.value))}
                        onFocus={() => setFocused(`km-${r.id}`)} onBlur={() => setFocused(null)}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-150 flex items-center text-[11px] font-bold text-neutral-60">km</span>
                    </div>
                  </div>

                  <div className="space-y-75">
                    <label className={smallLabelCls(`stop-${r.id}`)}>Arrêt</label>
                    <div className="relative">
                      <input
                        className="input pr-[40px]"
                        inputMode="numeric"
                        value={r.stopMin}
                        placeholder="0"
                        onChange={e => onRavitoStopChange(r.id, e.target.value.replace(/\D/g, '').slice(0, 3))}
                        onFocus={() => setFocused(`stop-${r.id}`)} onBlur={() => setFocused(null)}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-150 flex items-center text-[11px] font-bold text-neutral-60">min</span>
                    </div>
                  </div>

                  {raceTime && (
                    <div className="space-y-75">
                      <label className={smallLabelCls(`cutoff-${r.id}`)}>
                        Barrière <span className="font-normal text-neutral-60">(optionnel)</span>
                      </label>
                      <input
                        className="input"
                        placeholder="--:--"
                        value={r.cutoff}
                        onChange={e => onRavitoCutoffChange(r.id, sanitizeTimeInput(e.target.value))}
                        onFocus={() => setFocused(`cutoff-${r.id}`)}
                        onBlur={e => { onRavitoCutoffChange(r.id, normalizeTimeInput(e.target.value)); setFocused(null) }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={onAddRavito} className="btn btn-text">
              <Plus className="size-3.5" strokeWidth={2.5} />
              Ajouter un ravitaillement
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Étape 3 — Objectif de temps
───────────────────────────────────────── */
function Step3Objectif({ customTarget, setCustomTarget, durationMins, setDurationMins }: {
  customTarget: boolean
  setCustomTarget: (v: boolean) => void
  durationMins: number
  setDurationMins: (v: number) => void
}) {
  const [focused, setFocused] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const avgPaceSec = Math.round((durationMins * 60) / TOTAL_KM)
  const keph = +(TOTAL_KM_EFFORT / (durationMins / 60)).toFixed(1)

  function changeDuration(mins: number) { setDurationMins(Math.max(1, Math.round(mins))) }
  function changePaceSec(sec: number) { setDurationMins(Math.max(1, Math.round((Math.max(30, sec) * TOTAL_KM) / 60))) }
  function changeKeph(k: number) { setDurationMins(Math.max(1, Math.round((TOTAL_KM_EFFORT / Math.max(0.1, k)) * 60))) }

  function parseDuration(text: string): number | null {
    const hm = text.match(/(\d+)\s*h(?:\s*(\d{1,2}))?/i)
    if (hm) return parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0)
    const min = text.match(/(\d+)\s*min/i)
    if (min) return parseInt(min[1], 10)
    const n = parseInt(text, 10)
    return Number.isFinite(n) ? n : null
  }

  function commitDraft(id: string, fallback: string) {
    const raw = drafts[id] ?? fallback
    if (id === 'duration') {
      const mins = parseDuration(raw)
      if (mins != null) changeDuration(mins)
    } else if (id === 'pace') {
      const sec = paceToSec(raw)
      if (sec > 0) changePaceSec(sec)
    } else if (id === 'keph') {
      const k = parseFloat(raw.replace(',', '.'))
      if (Number.isFinite(k) && k > 0) changeKeph(k)
    }
    setDrafts(d => { const next = { ...d }; delete next[id]; return next })
    setFocused(null)
  }

  const fields = [
    {
      id: 'duration', label: 'Durée', unit: 'h', display: fmtTime(durationMins),
      onUp: () => changeDuration(durationMins + 5), onDown: () => changeDuration(durationMins - 5),
    },
    {
      id: 'pace', label: 'Allure', unit: 'min/km', display: secToPace(avgPaceSec),
      onUp: () => changePaceSec(avgPaceSec + 30), onDown: () => changePaceSec(avgPaceSec - 30),
    },
    {
      id: 'keph', label: 'km-effort/h', unit: 'ke/h', display: keph.toFixed(1).replace('.', ','),
      onUp: () => changeKeph(keph + 0.1), onDown: () => changeKeph(keph - 0.1),
    },
  ]

  return (
    <section className="space-y-150 lg:space-y-300">
      <div>
        <h2 className="text-[20px] font-extrabold text-neutral-800">Objectif de temps</h2>
      </div>

      {/* Temps de course estimé — tuile mise en avant, façon bento du tableau de bord */}
      <div className="widget-card overflow-hidden p-300">
        <div className="flex items-center gap-150">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
            <Clock className="size-5 text-neutral-300" strokeWidth={1.5} />
          </div>
          <p className="widget-label">Temps de course estimé</p>
        </div>
        <p className="mt-200 text-[40px] font-extrabold leading-none text-primary-600">
          {fmtTime(ESTIMATED_MINS)}
        </p>
        <p className="mt-75 text-[12px] text-neutral-90">Selon le profil coureur que vous avez renseigné.</p>

        <div className="mt-200 flex items-center gap-300 border-t border-neutral-20 pt-200">
          <div>
            <p className="widget-label widget-label-compact">Allure moyenne</p>
            <p className="mt-25 text-[18px] font-extrabold text-neutral-800">
              {secToPace(ESTIMATED_PACE_SEC)} <span className="text-[12px] font-normal text-neutral-80">min/km</span>
            </p>
          </div>
          <div className="h-9 w-px bg-neutral-30" />
          <div>
            <p className="widget-label widget-label-compact">km-effort/h</p>
            <p className="mt-25 text-[18px] font-extrabold text-neutral-800">
              {ESTIMATED_KEPH.toFixed(1).replace('.', ',')} <span className="text-[12px] font-normal text-neutral-80">ke/h</span>
            </p>
          </div>
        </div>
      </div>

      <div className="widget-card overflow-hidden">
        <div className="flex items-center justify-between px-300 py-200">
          <div>
            <p className="text-[14px] font-bold text-neutral-800">Définir mon propre objectif</p>
            <p className="mt-50 text-[11px] text-neutral-90">
              {customTarget
                ? 'Ajustez la durée, l’allure ou le km-effort ci-dessous.'
                : `Sans objectif personnalisé, le plan est calculé sur l’estimation de ${fmtTime(ESTIMATED_MINS)}.`}
            </p>
          </div>
          <SwitchToggle checked={customTarget} onChange={() => setCustomTarget(!customTarget)} />
        </div>

        {customTarget && (
          <div className="grid grid-cols-3 gap-150 border-t border-neutral-20 px-300 py-200">
            {fields.map(({ id, label, unit, display, onUp, onDown }) => (
              <div key={id} className="space-y-75">
                <p className={`text-[10px] font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-80'}`}>{label}</p>
                <div className="relative">
                  <input
                    className={['input pl-150 pr-[64px]', focused === id ? 'bg-primary-50/60 font-semibold' : ''].filter(Boolean).join(' ')}
                    value={drafts[id] ?? display}
                    onChange={e => setDrafts(d => ({ ...d, [id]: e.target.value }))}
                    onFocus={() => { setFocused(id); setDrafts(d => ({ ...d, [id]: display })) }}
                    onBlur={() => commitDraft(id, display)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-50 pr-150">
                    <span className="text-[11px] font-bold text-neutral-60">{unit}</span>
                    <div className="pointer-events-auto flex flex-col items-center">
                      <button type="button" onMouseDown={e => { e.preventDefault(); onUp() }} className="cursor-pointer p-25 text-neutral-400 transition-colors hover:text-primary-500">
                        <ChevronUp className="size-[11px]" strokeWidth={2.5} />
                      </button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); onDown() }} className="cursor-pointer p-25 text-neutral-400 transition-colors hover:text-primary-500">
                        <ChevronDown className="size-[11px]" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {customTarget && (
          <p className="border-t border-neutral-20 px-300 py-150 text-[11px] font-semibold text-primary-600">
            1 km-effort = 1 km plat ou 100 m de D+
          </p>
        )}
      </div>

      <div className="flex gap-200 rounded-2xl border border-secondary-600 bg-secondary-100 px-300 py-200">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500">
          <Sparkles className="size-4 text-neutral-0" strokeWidth={2} />
        </div>
        <p className="text-[14px] text-neutral-700 leading-relaxed">
          Dans tous les cas, vous pourrez modifier chaque section et tout ce que vous souhaitez dans le plan de course une fois généré.
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Étape 4 — Confirmation
───────────────────────────────────────── */
function Step4Confirmation({ raceName, raceLocation, raceDate, raceTime, finalDurationMins, ravitoKms }: {
  raceName: string
  raceLocation: string
  raceDate: string
  raceTime: string
  finalDurationMins: number
  ravitoKms: number[]
}) {
  const formattedDate = new Date(raceDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const avgPaceSec = Math.round((finalDurationMins * 60) / TOTAL_KM)
  const keph = +(TOTAL_KM_EFFORT / (finalDurationMins / 60)).toFixed(1)

  return (
    <section className="space-y-300">
      <div>
        <h2 className="text-[20px] font-extrabold text-neutral-800">Tout est prêt</h2>
        <p className="mt-75 text-[14px] text-neutral-90">Vérifiez les informations avant de générer votre plan.</p>
      </div>

      {/* Recap card */}
      <div className="widget-card overflow-hidden">
        {/* Mini altimétrie + titre */}
        <div className="border-b border-neutral-20 px-300 pb-200 pt-200">
          <p className="text-[16px] font-extrabold text-neutral-900">{raceName}</p>
          <p className="mt-75 text-[10px] eyebrow text-neutral-80">
            {formattedDate} · {raceLocation} · Départ {raceTime}
          </p>
          <div className="mt-150">
            <AltimetryChart data={MOCK_GPX_DATA} height={160} segments={MOCK_SEPARATORS} ravitoKms={ravitoKms} />
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
              <p className="mt-50 whitespace-nowrap text-[14px] font-extrabold text-primary-600 lg:text-[18px]">
                {value}{unit && <span className="text-[10px] font-medium text-neutral-90 lg:text-[12px]"> {unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Objectif + Allure */}
        <div className="flex divide-x divide-neutral-20">
          <div className="flex w-1/3 flex-col items-center py-150 text-center">
            <span className="text-[9px] eyebrow text-neutral-80 lg:text-[10px]">Objectif</span>
            <span className="mt-50 whitespace-nowrap text-[14px] font-extrabold text-secondary-600 lg:text-[18px]">
              {fmtTime(finalDurationMins)}
            </span>
          </div>
          <div className="flex w-2/3 flex-col items-center py-150 text-center">
            <span className="text-[9px] eyebrow text-neutral-80 lg:text-[10px]">Allure moyenne</span>
            <span className="mt-50 whitespace-nowrap text-[14px] font-extrabold text-teal-600 lg:text-[18px]">
              {secToPace(avgPaceSec)} <span className="text-[10px] font-medium text-neutral-90 lg:text-[12px]">min/km</span>
              {' · '}
              {keph.toFixed(1).replace('.', ',')} <span className="text-[10px] font-medium text-neutral-90 lg:text-[12px]">ke/h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bot notice */}
      <div className="flex gap-200 rounded-2xl border border-secondary-600 bg-secondary-100 px-300 py-200">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500">
          <Sparkles className="size-4 text-neutral-0" strokeWidth={2} />
        </div>
        <p className="text-[14px] text-neutral-700 leading-relaxed">
          Le Cabri-Bot va calculer, pour chacun des {MOCK_GPX_STATS.segments} segments, une allure personnalisée basée sur le terrain et la pente, vos aptitudes et votre objectif de {fmtTime(finalDurationMins)}. Tout sera librement ajustable ensuite.
        </p>
      </div>
    </section>
  )
}
