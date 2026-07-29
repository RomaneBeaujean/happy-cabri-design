import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Wand2, Plus, Trash2 } from 'lucide-react'
import type { AltimetryPoint } from '../../components/AltimetryChart'
import { detectClimbSeparators } from './climbDetector'

interface Props {
  totalKm: number
  initialKms: number[]
  altData: AltimetryPoint[]
  onApply: (kms: number[]) => void
  onClose: () => void
}

export default function RedefineSegmentsModal({ totalKm, initialKms, altData, onApply, onClose }: Props) {
  const [draftKms, setDraftKms] = useState<number[]>(() => [...initialKms].sort((a, b) => a - b))
  const [addDraft, setAddDraft] = useState('')

  function addPoint() {
    const parsed = parseFloat(addDraft.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= totalKm) return
    if (draftKms.some(km => Math.abs(km - parsed) < 0.1)) return
    setDraftKms(prev => [...prev, +parsed.toFixed(1)].sort((a, b) => a - b))
    setAddDraft('')
  }

  function removePoint(km: number) {
    setDraftKms(prev => prev.filter(k => k !== km))
  }

  function regenerate() {
    setDraftKms(detectClimbSeparators(altData))
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-20 px-200 py-200">
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
                  <button
                    type="button"
                    aria-label="Supprimer ce point"
                    onClick={() => removePoint(km)}
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-3" strokeWidth={2} />
                  </button>
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
              <button
                type="button"
                onClick={addPoint}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-neutral-30 text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-100 border-t border-neutral-20 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={() => onApply(draftKms)}>Appliquer</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
