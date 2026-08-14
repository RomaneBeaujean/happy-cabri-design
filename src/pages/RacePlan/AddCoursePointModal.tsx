import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Droplets, Fence } from 'lucide-react'
import { sanitizeTimeInput, normalizeTimeInput } from './format'

const RAVITO_COLOR = '#C0389D'
const CUTOFF_COLOR = '#c0392b'

function Switch({ checked, onChange, color }: { checked: boolean; onChange: () => void; color: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative h-[22px] w-10 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? color : 'var(--color-neutral-40)' }}
    >
      <span
        className="absolute left-[3px] top-[3px] size-[16px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

interface Props {
  totalKm: number
  onAdd: (km: number, ravito: { enabled: boolean; mins: string }, cutoff: { enabled: boolean; time: string }) => void
  onClose: () => void
}

export default function AddCoursePointModal({ totalKm, onAdd, onClose }: Props) {
  const [kmDraft, setKmDraft] = useState('')
  const [ravitoEnabled, setRavitoEnabled] = useState(false)
  const [ravitoMins, setRavitoMins] = useState('3')
  const [cutoffEnabled, setCutoffEnabled] = useState(false)
  const [cutoffTime, setCutoffTime] = useState('')

  const parsedKm = parseFloat(kmDraft.replace(',', '.'))
  const isValidKm = Number.isFinite(parsedKm) && parsedKm > 0 && parsedKm < totalKm
  const normalizedCutoff = cutoffEnabled ? normalizeTimeInput(cutoffTime) : null
  const canSubmit = isValidKm && (!cutoffEnabled || !!normalizedCutoff)

  function submit() {
    if (!canSubmit) return
    onAdd(
      +parsedKm.toFixed(1),
      { enabled: ravitoEnabled, mins: ravitoMins || '3' },
      { enabled: cutoffEnabled, time: normalizedCutoff ?? '' },
    )
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe w-full max-w-[420px] overflow-hidden rounded-3xl shadow-lg">
          <div className="flex items-center justify-between px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Ajouter un point de parcours</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-150 px-200 py-200">
            <div className="widget-card-glass space-y-75 p-150">
              <p className="widget-label widget-label-compact">Distance</p>
              <div className="flex items-center gap-75">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={kmDraft}
                  onChange={e => setKmDraft(e.target.value.replace(/[^\d.,]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  className="input flex-1 py-100 text-[13px]"
                />
                <span className="shrink-0 text-[13px] font-medium text-neutral-400">km</span>
              </div>
            </div>

            <div className="widget-card-glass space-y-100 p-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-75">
                  <Droplets className="size-4 shrink-0" strokeWidth={2} style={{ color: ravitoEnabled ? RAVITO_COLOR : 'var(--color-neutral-300)' }} />
                  <span className="widget-card-title">Ravitaillement</span>
                </div>
                <Switch checked={ravitoEnabled} onChange={() => setRavitoEnabled(v => !v)} color={RAVITO_COLOR} />
              </div>
              {ravitoEnabled && (
                <div className="flex items-center gap-75 pl-150">
                  <span className="shrink-0 text-[12px] text-neutral-500">Temps d'arrêt</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="3"
                    value={ravitoMins}
                    onChange={e => setRavitoMins(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="input w-[70px] py-75 text-[12px]"
                  />
                  <span className="shrink-0 text-[12px] text-neutral-500">min</span>
                </div>
              )}
            </div>

            <div className="widget-card-glass space-y-100 p-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-75">
                  <Fence className="size-4 shrink-0" strokeWidth={2} style={{ color: cutoffEnabled ? CUTOFF_COLOR : 'var(--color-neutral-300)' }} />
                  <span className="widget-card-title">Barrière horaire</span>
                </div>
                <Switch checked={cutoffEnabled} onChange={() => setCutoffEnabled(v => !v)} color={CUTOFF_COLOR} />
              </div>
              {cutoffEnabled && (
                <div className="flex items-center gap-75 pl-150">
                  <span className="shrink-0 text-[12px] text-neutral-500">Heure max</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="--:--"
                    value={cutoffTime}
                    onChange={e => setCutoffTime(sanitizeTimeInput(e.target.value))}
                    className="input w-[70px] py-75 text-[12px]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="btn btn-primary disabled:pointer-events-none disabled:opacity-40"
              disabled={!canSubmit}
              onClick={submit}
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
