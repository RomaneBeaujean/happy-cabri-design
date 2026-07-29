import { createPortal } from 'react-dom'
import { CircleDot, Droplets } from 'lucide-react'

interface Props {
  x: number
  y: number
  km: number
  onChoose: (kind: 'separator' | 'ravito') => void
  onClose: () => void
}

export default function AddPointPopup({ x, y, km, onChoose, onClose }: Props) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="fixed z-[999] w-[210px] overflow-hidden rounded-2xl border border-neutral-20 bg-white shadow-lg"
        style={{ top: y, left: x, transform: 'translate(-50%, 10px)' }}
      >
        <div className="border-b border-neutral-20 px-200 py-100">
          <p className="text-[11px] font-semibold text-neutral-400">Ajouter à {km} km</p>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-100 px-200 py-150 text-left hover:bg-neutral-20"
          onClick={() => onChoose('separator')}
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-neutral-30 text-neutral-600">
            <CircleDot className="size-[14px]" strokeWidth={2} />
          </span>
          <span className="text-[13px] font-medium text-neutral-700">Séparateur</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-100 border-t border-neutral-20 px-200 py-150 text-left hover:bg-neutral-20"
          onClick={() => onChoose('ravito')}
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#f9eef4] text-[#8d3a68]">
            <Droplets className="size-[14px]" strokeWidth={2} />
          </span>
          <span className="text-[13px] font-medium text-neutral-700">Ravitaillement</span>
        </button>
      </div>
    </>,
    document.body
  )
}
