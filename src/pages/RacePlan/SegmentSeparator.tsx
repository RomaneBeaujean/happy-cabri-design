import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Timer, Droplets, Fence, Check, X } from 'lucide-react'
import ColorTag from '../../components/ColorTag'
import { sanitizeTimeInput, normalizeTimeInput } from './format'

// ── Petits contrôles réutilisés par le séparateur (et par SegmentCard pour la scission) ──
export function AddSeparatorButton({ icon, tooltip, colorClasses, onClick }: {
  icon: ReactNode
  tooltip: string
  colorClasses: string
  onClick: () => void
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={tooltip}
        onClick={onClick}
        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border border-dashed transition-all hover:scale-110 ${colorClasses}`}
      >
        {icon}
      </button>
      <span className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-20 whitespace-nowrap rounded-md bg-neutral-800 px-75 py-25 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </div>
  )
}

function RavitoTag({ value, onChange, onSave, onCancel }: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="relative z-[999] flex h-[26px] shrink-0 items-center gap-50 rounded-full bg-pink-50 px-100 text-[12px] font-medium text-pink-800 shadow-lg">
      <Droplets className="size-3 shrink-0" strokeWidth={2} />
      <span className="shrink-0 whitespace-nowrap">Ravitaillement, arrêt</span>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={onCancel}
        onKeyDown={e => { if (e.key === 'Enter') onSave() }}
        style={{ width: `${Math.max(1, value.length)}ch` }}
        className="shrink-0 border-none bg-transparent p-0 text-left text-[12px] font-medium text-pink-800 outline-none placeholder:text-pink-300"
      />
      <span className="shrink-0">min</span>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}
        className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
      >
        <Check className="size-[9px]" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function CutoffTag({ value, onChange, onSave, onCancel }: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="relative z-[999] flex h-[26px] shrink-0 items-center gap-50 rounded-full bg-red-50 px-100 text-[12px] font-medium text-red-800 shadow-lg">
      <Fence className="size-3 shrink-0" strokeWidth={2} />
      <span className="shrink-0 whitespace-nowrap">Barrière horaire</span>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        placeholder="--:--"
        value={value}
        onChange={e => onChange(sanitizeTimeInput(e.target.value))}
        onBlur={onCancel}
        onKeyDown={e => { if (e.key === 'Enter') onSave() }}
        className="w-[48px] shrink-0 border-none bg-transparent p-0 text-[12px] font-medium text-red-800 outline-none placeholder:text-red-300"
      />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}
        className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
      >
        <Check className="size-[9px]" strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function KmTag({ value, onChange, onSave, onCancel }: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="relative z-[999] flex h-[26px] shrink-0 items-center gap-50 rounded-full border border-neutral-800 bg-white px-100 text-[12px] font-medium text-neutral-800 shadow-lg">
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onBlur={onCancel}
        onKeyDown={e => { if (e.key === 'Enter') onSave() }}
        style={{ width: `${Math.max(1, value.length)}ch` }}
        className="shrink-0 border-none bg-transparent p-0 text-left text-[12px] font-medium text-neutral-800 outline-none"
      />
      <span className="shrink-0">km</span>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}
        className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
      >
        <Check className="size-[9px]" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── Séparateur inter-segment ───────────────────────────────────────────────────
interface Props {
  km: number
  passageLabel: string
  elapsedLabel: string
  isRavito: boolean
  onAddRavito: (mins: string) => void
  onRemoveRavito: () => void
  ravitoStop: string
  onRavitoStopChange: (mins: string) => void
  cutoffTime: string | undefined
  onAddCutoff: (time: string) => void
  onRemoveCutoff: () => void
  onCutoffTimeChange: (time: string) => void
  onKmChange: (newKm: number) => void
}

export default function SegmentSeparator({
  km, passageLabel, elapsedLabel, isRavito, onAddRavito, onRemoveRavito, ravitoStop, onRavitoStopChange,
  cutoffTime, onAddCutoff, onRemoveCutoff, onCutoffTimeChange, onKmChange,
}: Props) {
  const [editingRavito, setEditingRavito] = useState(false)
  const [ravitoDraft, setRavitoDraft] = useState('3')
  const [editingCutoff, setEditingCutoff] = useState(false)
  const [cutoffDraft, setCutoffDraft] = useState('')
  const [editingKm, setEditingKm] = useState(false)
  const [kmDraft, setKmDraft] = useState('')
  const isCutoff = cutoffTime !== undefined

  const dot = <span className="z-10 size-[10px] shrink-0 rounded-full bg-neutral-800" />

  function startKmEdit() {
    setKmDraft(String(km))
    setEditingKm(true)
  }
  function saveKm() {
    const parsed = parseFloat(kmDraft)
    if (Number.isFinite(parsed)) onKmChange(parsed)
    setEditingKm(false)
  }
  function cancelKm() {
    setEditingKm(false)
  }

  const kmNode = editingKm ? (
    <KmTag value={kmDraft} onChange={setKmDraft} onSave={saveKm} onCancel={cancelKm} />
  ) : (
    <ColorTag color="primary" label={`${km} km`} onClick={startKmEdit} />
  )

  const heureChronoNode = (
    <div className="flex min-w-0 flex-wrap items-center gap-50">
      <ColorTag color="purple" icon={<Clock className="size-3" strokeWidth={2} />} label={passageLabel} />
      <ColorTag color="teal" icon={<Timer className="size-3" strokeWidth={2} />} label={elapsedLabel} />
    </div>
  )

  // Le check est le seul moyen de valider — un clic en dehors (blur) annule sans rien modifier.
  function startRavitoEdit() {
    setRavitoDraft(isRavito ? ravitoStop : '3')
    setEditingRavito(true)
  }
  function saveRavito() {
    if (isRavito) onRavitoStopChange(ravitoDraft)
    else onAddRavito(ravitoDraft || '3')
    setEditingRavito(false)
  }
  function cancelRavito() {
    setEditingRavito(false)
  }

  function startCutoffEdit() {
    setCutoffDraft(isCutoff ? (cutoffTime ?? '') : '')
    setEditingCutoff(true)
  }
  function saveCutoff() {
    const normalized = normalizeTimeInput(cutoffDraft)
    if (isCutoff) {
      if (normalized) onCutoffTimeChange(normalized)
      else onRemoveCutoff()
    } else if (normalized) {
      onAddCutoff(normalized)
    }
    setEditingCutoff(false)
  }
  function cancelCutoff() {
    setEditingCutoff(false)
  }

  // Tag ravitaillement déjà ajouté — affichage compact ou édition de la durée d'arrêt
  const ravitoDisplay = isRavito && (
    editingRavito ? (
      <RavitoTag value={ravitoDraft} onChange={setRavitoDraft} onSave={saveRavito} onCancel={cancelRavito} />
    ) : (
      <ColorTag
        color="pink"
        icon={<Droplets className="size-3" strokeWidth={2} />}
        label={parseInt(ravitoStop, 10) > 0 ? `Ravitaillement · ${ravitoStop} min` : 'Ravitaillement'}
        rightIcon={<X className="size-[9px]" strokeWidth={2.5} />}
        onRightIconClick={onRemoveRavito}
        onClick={startRavitoEdit}
      />
    )
  )

  // Tag barrière horaire déjà ajoutée — affichage compact ou édition de l'heure
  const cutoffDisplay = isCutoff && (
    editingCutoff ? (
      <CutoffTag value={cutoffDraft} onChange={setCutoffDraft} onSave={saveCutoff} onCancel={cancelCutoff} />
    ) : (
      <ColorTag
        color="red"
        icon={<Fence className="size-3" strokeWidth={2} />}
        label={cutoffTime ? cutoffTime.replace(':', 'h') : 'Barrière horaire'}
        rightIcon={<X className="size-[9px]" strokeWidth={2.5} />}
        onRightIconClick={onRemoveCutoff}
        onClick={startCutoffEdit}
      />
    )
  )

  // Bouton d'ajout ravitaillement (masqué une fois ajouté) — s'agrandit en place vers la gauche
  const ravitoAction = !isRavito && (
    editingRavito ? (
      <RavitoTag value={ravitoDraft} onChange={setRavitoDraft} onSave={saveRavito} onCancel={cancelRavito} />
    ) : (
      <AddSeparatorButton
        icon={<Droplets className="size-[12px]" strokeWidth={2.5} />}
        tooltip="Ajouter un ravitaillement"
        colorClasses="border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
        onClick={startRavitoEdit}
      />
    )
  )

  // Bouton d'ajout barrière horaire (masqué une fois ajoutée) — mêmes standards que le ravitaillement
  const cutoffAction = !isCutoff && (
    editingCutoff ? (
      <CutoffTag value={cutoffDraft} onChange={setCutoffDraft} onSave={saveCutoff} onCancel={cancelCutoff} />
    ) : (
      <AddSeparatorButton
        icon={<Fence className="size-[12px]" strokeWidth={2.5} />}
        tooltip="Ajouter une barrière horaire"
        colorClasses="border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
        onClick={startCutoffEdit}
      />
    )
  )

  return (
    <div className="flex flex-col gap-50 py-50">
      {/* Rail collé à gauche à tous les breakpoints — tags km/heure/chrono sur une ligne, ravito/barrière en dessous, boutons d'ajout en position absolue tout à droite */}
      <div className="relative flex flex-col gap-50 pr-900">
        <div className="flex items-center gap-75">
          <div className="flex w-[16px] shrink-0 items-center justify-center">
            {dot}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-50">
            {kmNode}
            {heureChronoNode}
          </div>
        </div>

        {(ravitoDisplay || cutoffDisplay) && (
          <div className="flex flex-wrap items-center gap-50 pl-[24px]">
            {ravitoDisplay}
            {cutoffDisplay}
          </div>
        )}

        <div className="absolute right-0 top-0 flex items-center gap-75">
          {ravitoAction}
          {cutoffAction}
        </div>
      </div>

      {(editingRavito || editingCutoff || editingKm) && createPortal(
        <div className="fixed inset-0 z-[998] bg-black/30" />,
        document.body
      )}
    </div>
  )
}
