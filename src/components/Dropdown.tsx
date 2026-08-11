import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface DropdownProps<T extends string> {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export default function Dropdown<T extends string>({ value, options, onChange, className = '' }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    setOpen(o => !o)
  }

  const current = options.find(o => o.value === value)

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`input flex items-center justify-between gap-100 py-100 text-left text-[13px] ${className}`}
      >
        <span className="flex min-w-0 items-center gap-75 truncate">
          {current?.icon}
          <span className="truncate">{current?.label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="fixed z-[999] overflow-hidden rounded-2xl border border-neutral-20 bg-white py-50 shadow-lg"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className="flex w-full items-center gap-75 px-150 py-100 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-20"
              >
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.value === value && <Check className="size-3.5 shrink-0 text-primary-600" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
