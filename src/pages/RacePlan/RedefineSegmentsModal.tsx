import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Wand2, Plus, Trash2, Droplets } from 'lucide-react'
import type { AltimetryPoint } from '../../components/AltimetryChart'
import { detectClimbSeparators } from './climbDetector'

const RAVITO_COLOR = '#C0389D'

function RavitoSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Ravitaillement"
      onClick={onChange}
      className="relative h-[18px] w-8 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? RAVITO_COLOR : 'var(--color-neutral-40)' }}
    >
      <span
        className="absolute left-[2px] top-[2px] size-[14px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(14px)' : 'translateX(0)' }}
      />
    </button>
  )
}

interface Props {
  totalKm: number
  initialKms: number[]
  initialRavitoKms: number[]
  altData: AltimetryPoint[]
  onApply: (kms: number[], ravitoKms: number[]) => void
  onClose: () => void
}

export default function RedefineSegmentsModal({ totalKm, initialKms, initialRavitoKms, altData, onApply, onClose }: Props) {
  const [draftKms, setDraftKms] = useState<number[]>(() => [...initialKms].sort((a, b) => a - b))
  const [ravitoKms, setRavitoKms] = useState<Set<number>>(() => new Set(initialRavitoKms))
  const [addDraft, setAddDraft] = useState('')
  const [addRavitoDraft, setAddRavitoDraft] = useState(false)

  function toggleRavito(km: number) {
    setRavitoKms(prev => {
      const next = new Set(prev)
      if (next.has(km)) next.delete(km)
      else next.add(km)
      return next
    })
  }

  function addPoint() {
    const parsed = parseFloat(addDraft.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= totalKm) return
    if (draftKms.some(km => Math.abs(km - parsed) < 0.1)) return
    const rounded = +parsed.toFixed(1)
    setDraftKms(prev => [...prev, rounded].sort((a, b) => a - b))
    if (addRavitoDraft) setRavitoKms(prev => new Set(prev).add(rounded))
    setAddDraft('')
    setAddRavitoDraft(false)
  }

  function removePoint(km: number) {
    setDraftKms(prev => prev.filter(k => k !== km))
    setRavitoKms(prev => {
      if (!prev.has(km)) return prev
      const next = new Set(prev)
      next.delete(km)
      return next
    })
  }

  function regenerate() {
    setDraftKms(detectClimbSeparators(altData))
    setRavitoKms(new Set())
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-20 px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Redéfinir les segments</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-200 py-200">
            <button
              type="button"
              onClick={regenerate}
              className="btn btn-secondary btn-full mb-200"
            >
              <Wand2 className="size-4" strokeWidth={2} />
              Régénérer automatiquement (montées/descentes)
            </button>

            <p className="widget-label mb-100">Points de découpage ({draftKms.length + 2})</p>
            <div className="space-y-75">
              <div className="flex items-center justify-between rounded-xl bg-neutral-10 px-150 py-100">
                <span className="text-[12px] font-semibold text-neutral-500">Départ</span>
                <span className="text-[12px] font-medium text-neutral-800">0 km</span>
              </div>
              {draftKms.map(km => (
                <div key={km} className="flex items-center justify-between rounded-xl bg-neutral-10 px-150 py-100">
                  <span className="text-[12px] font-medium text-neutral-800">{km} km</span>
                  <div className="flex items-center gap-150">
                    <div className="flex items-center gap-50">
                      <Droplets
                        className="size-3"
                        strokeWidth={2}
                        style={{ color: ravitoKms.has(km) ? RAVITO_COLOR : 'var(--color-neutral-300)' }}
                      />
                      <RavitoSwitch checked={ravitoKms.has(km)} onChange={() => toggleRavito(km)} />
                    </div>
                    <button
                      type="button"
                      aria-label="Supprimer ce point"
                      onClick={() => removePoint(km)}
                      className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-neutral-10 px-150 py-100">
                <span className="text-[12px] font-semibold text-neutral-500">Arrivée</span>
                <span className="text-[12px] font-medium text-neutral-800">{totalKm} km</span>
              </div>
            </div>

            <div className="mt-150 flex items-center gap-75">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ajouter un point (km)"
                value={addDraft}
                onChange={e => setAddDraft(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') addPoint() }}
                className="input flex-1 py-75 text-[12px]"
              />
              <div className="flex items-center gap-50">
                <Droplets
                  className="size-3"
                  strokeWidth={2}
                  style={{ color: addRavitoDraft ? RAVITO_COLOR : 'var(--color-neutral-300)' }}
                />
                <RavitoSwitch checked={addRavitoDraft} onChange={() => setAddRavitoDraft(v => !v)} />
              </div>
              <button
                type="button"
                onClick={addPoint}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-neutral-30 text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-100 border-t border-neutral-20 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={() => onApply(draftKms, [...ravitoKms])}>Appliquer</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
