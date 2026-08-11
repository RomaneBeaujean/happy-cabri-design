import { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Edit2, GripVertical, Droplets, ChevronUp, ChevronDown, Save,
  Plus, Minus, X, Timer, Flame, AlertTriangle,
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import ColorTag, { type TagColor } from '../components/ColorTag'
import Dropdown from '../components/Dropdown'

function paceToSec(p: string) {
  const [m, s = '0'] = p.split(':')
  return (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
}
function secToPace(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Static data ───────────────────────────────────────────────────────────────

const initChronos = [
  { label: '1 km',          time: '4:12'  },
  { label: '5 km',          time: '22:45' },
  { label: '10 km',         time: '48:30' },
  { label: 'Semi-marathon', time: '1h48'  },
  { label: '30 km',         time: '2h55'  },
  { label: 'Marathon',      time: '3h52'  },
]

type ProductCategory = 'gel' | 'barre' | 'compote' | 'boisson' | 'autre'

const categoryConfig: Record<ProductCategory, { label: string; color: TagColor }> = {
  gel:     { label: 'Gel',     color: 'orange'  },
  barre:   { label: 'Barre',   color: 'brown'   },
  compote: { label: 'Compote', color: 'green'   },
  boisson: { label: 'Boisson', color: 'teal'    },
  autre:   { label: 'Autre',   color: 'neutral' },
}

type Product = { id: string; name: string; glucides: number; ratio: string; category: ProductCategory }

const initProducts: Product[] = [
  { id: 'p1', name: 'Maurten Gel 100',             glucides: 25, ratio: '1:0.8', category: 'gel'     },
  { id: 'p2', name: 'Spring Energy Awesome Sauce', glucides: 45, ratio: '2:1',   category: 'gel'     },
  { id: 'p3', name: 'Tailwind Endurance Fuel',     glucides: 50, ratio: '2:1',   category: 'boisson' },
  { id: 'p4', name: 'Clémentines fraîches',        glucides: 12, ratio: '1:1',   category: 'autre'   },
]

const initAllures = [
  { id: 'courte', label: 'Courte', range: '< 25 km',    color: 'text-fuchsia-700', dot: 'bg-fuchsia-600', max: '4:15', min: '10:00', descenteTechnique: '6:30', kmEffort: '15' },
  { id: 'longue', label: 'Longue', range: '25 – 60 km', color: 'text-orange-700',  dot: 'bg-orange-600',  max: '4:40', min: '12:30', descenteTechnique: '7:30', kmEffort: '10' },
  { id: 'ultra',  label: 'Ultra',  range: '> 60 km',     color: 'text-blue-900',   dot: 'bg-blue-900',    max: '5:10', min: '15:00', descenteTechnique: '9:00', kmEffort: '6'  },
]

type AllureRow = typeof initAllures[number]

const allureParams: { key: 'max' | 'min' | 'descenteTechnique' | 'kmEffort'; label: string; unit: string; kind: 'pace' | 'number' }[] = [
  { key: 'max',               label: 'Allure max (plat / descente)', unit: '/km', kind: 'pace'   },
  { key: 'min',               label: 'Allure min (montée raide)',    unit: '/km', kind: 'pace'   },
  { key: 'descenteTechnique', label: 'Descente technique',           unit: '/km', kind: 'pace'   },
  { key: 'kmEffort',          label: 'Km-effort moyen',              unit: '',    kind: 'number' },
]

type CompetenceRow = { label: string; value: number } // /10

const initCompetences: CompetenceRow[] = [
  { label: 'Grimpeur',   value: 8 },
  { label: 'Descendeur', value: 6 },
  { label: 'Endurance',  value: 7 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function NumberField({ value, onChange, placeholder, step = 1, min = 0, onEnter, variant = 'box' }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  step?: number
  min?: number
  onEnter?: () => void
  variant?: 'box' | 'pill'
}) {
  function bump(dir: 1 | -1) {
    const base = parseFloat(value.replace(',', '.'))
    const next = Math.max(min, (Number.isFinite(base) ? base : 0) + dir * step)
    onChange(String(next))
  }

  if (variant === 'pill') {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-75 rounded-full border border-neutral-40 bg-white p-50 lg:w-fit lg:flex-none">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); bump(-1) }}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 transition-colors hover:bg-secondary-300"
        >
          <Minus className="size-3.5" strokeWidth={2.5} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
          className="w-full min-w-0 flex-1 bg-transparent text-center text-[14px] font-bold text-neutral-800 outline-none placeholder:text-neutral-60 lg:w-12 lg:flex-none"
        />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); bump(1) }}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 transition-colors hover:bg-secondary-300"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  return (
    <div className="input flex items-center gap-50 py-50 pr-50 pl-150">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
        className="w-full min-w-0 flex-1 bg-transparent text-[13px] text-neutral-800 outline-none placeholder:text-neutral-60"
      />
      <div className="flex shrink-0 items-center gap-25">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); bump(-1) }}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-30 hover:text-neutral-700"
        >
          <Minus className="size-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); bump(1) }}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-30 hover:text-neutral-700"
        >
          <Plus className="size-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function AllureCell({ value, editing, unit, kind, color, onChange }: {
  value: string
  editing: boolean
  unit: string
  kind: 'pace' | 'number'
  color: string
  onChange: (v: string) => void
}) {
  const step = (dir: 1 | -1) => {
    if (kind === 'pace') onChange(secToPace(Math.max(30, paceToSec(value) + dir * 15)))
    else onChange(String(Math.max(1, (parseInt(value) || 0) + dir)))
  }

  if (!editing) return (
    <p className={`text-center text-[12px] font-bold lg:text-[14px] ${color}`}>
      {value}{unit && <span className="ml-25 hidden text-[10px] font-medium text-neutral-400 lg:inline">{unit}</span>}
    </p>
  )

  return (
    <div className="relative">
      <input
        className={`input px-50 pr-8.5 text-center text-[10px] font-semibold lg:px-100 lg:pr-11.5 lg:text-[12px] ${color}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className="absolute inset-y-0 right-0 flex items-center gap-25 pr-50 pointer-events-none lg:pr-75">
        {unit && <span className="hidden text-[9px] font-bold text-neutral-60 lg:inline">{unit}</span>}
        <div className="flex flex-col items-center pointer-events-auto">
          <button type="button" onMouseDown={e => { e.preventDefault(); step(1) }}
            className="p-25 cursor-pointer text-neutral-400 hover:text-primary-500 transition-colors">
            <ChevronUp className="size-2.5" strokeWidth={2.5} />
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); step(-1) }}
            className="p-25 cursor-pointer text-neutral-400 hover:text-primary-500 transition-colors">
            <ChevronDown className="size-2.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StepperStat({ icon, label, value, unit, editing, onInc, onDec, color = 'secondary' }: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  editing: boolean
  onInc: () => void
  onDec: () => void
  color?: 'teal' | 'orange'
}) {
  const palette = color === 'teal'
    ? { border: 'border-teal-700', bg: 'bg-teal-100', chip: 'bg-teal-200 text-teal-800 hover:bg-teal-300', text: 'text-teal-800' }
    : { border: 'border-orange-700', bg: 'bg-orange-100', chip: 'bg-orange-200 text-orange-800 hover:bg-orange-300', text: 'text-orange-800' }

  return (
    <div className={`rounded-2xl border ${palette.border} ${palette.bg} p-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-150">
          {icon}
          <p className="widget-label">{label}</p>
        </div>
        <div className="flex items-center gap-100">
          {editing && (
            <button
              onClick={onDec}
              className={`flex size-6 items-center justify-center rounded-full transition-colors ${palette.chip}`}
            >
              <Minus className="size-3" strokeWidth={2.5} />
            </button>
          )}
          <span className={`w-16 text-center text-[16px] font-bold ${palette.text}`}>
            {value}
            <span className="ml-25 text-[12px] font-medium text-neutral-400">{unit}</span>
          </span>
          {editing && (
            <button
              onClick={onInc}
              className={`flex size-6 items-center justify-center rounded-full transition-colors ${palette.chip}`}
            >
              <Plus className="size-3" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EditToggleButton({ editing, onClick }: { editing: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`btn gap-75 px-150 text-[12px] lg:px-300 ${editing ? 'btn-primary' : 'btn-text'}`}
    >
      {editing
        ? <><Save className="size-3.5" strokeWidth={2} /><span className="hidden lg:inline">Enregistrer</span></>
        : <><Edit2 className="size-3.5" strokeWidth={2} /><span className="hidden lg:inline">Modifier</span></>}
    </button>
  )
}

function AddProductModal({ onAdd, onClose }: {
  onAdd: (p: Product) => void
  onClose: () => void
}) {
  const [category, setCategory]         = useState<ProductCategory>('gel')
  const [name, setName]                 = useState('')
  const [mode, setMode]                 = useState<'unit' | '100g'>('unit')
  const [glucidesUnit, setGlucidesUnit] = useState('')
  const [weight, setWeight]             = useState('')
  const [glucides100g, setGlucides100g] = useState('')

  const computedFrom100g = (() => {
    const w = parseFloat(weight.replace(',', '.'))
    const g = parseFloat(glucides100g.replace(',', '.'))
    if (!Number.isFinite(w) || !Number.isFinite(g) || w <= 0 || g <= 0) return null
    return Math.round((w * g) / 100)
  })()

  const finalGlucides = mode === 'unit' ? parseFloat(glucidesUnit.replace(',', '.')) : computedFrom100g
  const canSubmit = name.trim().length > 0 && finalGlucides != null && Number.isFinite(finalGlucides) && finalGlucides > 0

  function submit() {
    if (!canSubmit || finalGlucides == null) return
    onAdd({ id: `p${Date.now()}`, name: name.trim(), glucides: Math.round(finalGlucides), ratio: '—', category })
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-20 px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Ajouter un produit</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-200 px-200 py-200">
            <div className="space-y-75">
              <p className="widget-label widget-label-compact">Catégorie</p>
              <Dropdown
                value={category}
                onChange={setCategory}
                className="w-full"
                options={(Object.keys(categoryConfig) as ProductCategory[]).map(c => ({
                  value: c,
                  label: categoryConfig[c].label,
                }))}
              />
            </div>

            <div className="space-y-75">
              <p className="widget-label widget-label-compact">Nom</p>
              <input
                autoFocus
                type="text"
                placeholder="ex: Gel Maurten"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && mode === 'unit') submit() }}
                className="input w-full py-100 text-[13px]"
              />
            </div>

            <div className="space-y-75">
              <div className="flex items-center gap-100">
                <p className="widget-label widget-label-compact">Glucides</p>
                <div className="flex items-center gap-50 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMode('unit')}
                    className={`outline-none ${mode === 'unit' ? 'text-neutral-800' : 'text-neutral-40 hover:text-neutral-600'}`}
                  >
                    g/unité
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    type="button"
                    onClick={() => setMode('100g')}
                    className={`outline-none ${mode === '100g' ? 'text-neutral-800' : 'text-neutral-40 hover:text-neutral-600'}`}
                  >
                    pour 100g
                  </button>
                </div>
              </div>

              {mode === 'unit' ? (
                <div className="flex items-center gap-75">
                  <NumberField
                    placeholder="ex: 10"
                    value={glucidesUnit}
                    onChange={setGlucidesUnit}
                    onEnter={submit}
                    variant="pill"
                  />
                  <span className="shrink-0 text-[13px] font-medium text-neutral-400">g</span>
                </div>
              ) : (
                <div className="flex flex-col gap-75 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-75">
                    <NumberField
                      placeholder="glucides/100g"
                      value={glucides100g}
                      onChange={setGlucides100g}
                    />
                    <span className="shrink-0 text-[12px] font-medium text-neutral-400">/100g</span>
                  </div>
                  <div className="flex items-center gap-75">
                    <NumberField
                      placeholder="poids total"
                      value={weight}
                      onChange={setWeight}
                      step={5}
                    />
                    <span className="shrink-0 text-[12px] font-medium text-neutral-400">g</span>
                  </div>
                  <div className="flex items-center gap-75">
                    <span className="shrink-0 text-[13px] font-bold text-neutral-400">=</span>
                    <span className="w-14 shrink-0 text-center text-[13px] font-bold text-primary-700">
                      {computedFrom100g != null ? `${computedFrom100g} g` : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-100 border-t border-neutral-20 px-200 py-200">
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

function DeleteProductModal({ productName, onConfirm, onClose }: {
  productName: string
  onConfirm: () => void
  onClose: () => void
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="w-full max-w-[380px] overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="flex items-start gap-150 px-200 pt-200">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="size-4.5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-accent text-[16px] font-bold text-neutral-800">Supprimer ce produit ?</p>
              <p className="mt-50 text-[13px] text-neutral-600">
                {productName} sera retiré de votre liste de nutrition. Cette action est irréversible.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="btn bg-red-500 text-white hover:bg-red-600!"
              onClick={onConfirm}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

function RatingBar({ value, max = 10, editing, onChange }: {
  value: number
  max?: number
  editing?: boolean
  onChange?: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-50">
      <div className="flex gap-25">
        {Array.from({ length: max }, (_, i) => editing ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            className={`h-4 w-2.5 rounded-full transition-colors hover:bg-primary-400 ${i < value ? 'bg-primary-500' : 'bg-neutral-30'}`}
          />
        ) : (
          <span
            key={i}
            className={`h-4 w-2.5 rounded-full ${i < value ? 'bg-primary-500' : 'bg-neutral-30'}`}
          />
        ))}
      </div>
      <span className="ml-75 text-[12px] font-bold text-primary-700">{value}<span className="text-[10px] font-medium text-neutral-400">/{max}</span></span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RunnerProfile() {
  const [chronos, setChronos]             = useState(initChronos)
  const [editChronos, setEditChronos]     = useState(false)
  const [products, setProducts]           = useState(initProducts)
  const [editNutrition, setEditNutrition] = useState(false)
  const [waterPerHour, setWaterPerHour]   = useState(650)
  const [glucidesPerHour, setGlucidesPerHour] = useState(60)
  const [allures, setAllures]             = useState(initAllures)
  const [editAllures, setEditAllures]     = useState(false)
  const [competences, setCompetences]     = useState(initCompetences)
  const [editCompetences, setEditCompetences] = useState(false)
  const [dragId, setDragId]               = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const prevRects = useRef(new Map<string, DOMRect>())
  const reorderLock = useRef(false)

  const editAllure = (i: number, key: keyof AllureRow, val: string) =>
    setAllures(al => al.map((x, j) => j === i ? { ...x, [key]: val } : x))

  const editCompetence = (i: number, val: number) =>
    setCompetences(comp => comp.map((x, j) => j === i ? { ...x, value: val } : x))

  function moveProductOver(overId: string) {
    setProducts(pr => {
      const from = pr.findIndex(p => p.id === dragId)
      const to = pr.findIndex(p => p.id === overId)
      if (from === -1 || to === -1 || from === to) return pr
      const next = [...pr]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  // FLIP : anime les lignes qui changent de position quand `products` est réordonné.
  useLayoutEffect(() => {
    const newRects = new Map<string, DOMRect>()
    rowRefs.current.forEach((el, id) => newRects.set(id, el.getBoundingClientRect()))
    prevRects.current.forEach((prevRect, id) => {
      const el = rowRefs.current.get(id)
      const newRect = newRects.get(id)
      if (!el || !newRect) return
      const dy = prevRect.top - newRect.top
      if (dy) {
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
        requestAnimationFrame(() => {
          el.style.transition = 'transform 200ms ease'
          el.style.transform = ''
        })
      }
    })
    prevRects.current = newRects
  }, [products])

  return (
    <AppLayout activeItem="profil" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <p className="text-[11px] eyebrow text-neutral-90">
            Mon profil
          </p>
          <div className="mt-200 flex items-center gap-300">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[24px] font-bold text-neutral-0">
              RB
            </div>
            <div>
              <h1 className="text-[24px] font-extrabold text-neutral-800">Romane Beaujean</h1>
              <p className="mt-25 text-[14px] text-neutral-80">Traileur · Niveau intermédiaire</p>
            </div>
          </div>
        </section>

        {/* ── Allures ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Allures</p>
            <EditToggleButton editing={editAllures} onClick={() => setEditAllures(v => !v)} />
          </div>

          <div className="px-150 pb-150 lg:px-200 lg:pb-200">
            <div>
              {/* Header row — types de distance */}
              <div className="grid grid-cols-[52px_repeat(3,1fr)] pb-75 lg:grid-cols-[76px_repeat(3,1fr)]">
                <span />
                {allures.map(a => (
                  <div key={a.id} className="px-25 text-center lg:px-75">
                    <p className="flex items-center justify-center gap-50 text-[10px] font-bold text-neutral-800 lg:text-[11px]">
                      <span className={`size-1.5 shrink-0 rounded-full ${a.dot}`} />
                      {a.label}
                    </p>
                    <p className="hidden text-[9px] text-neutral-400 lg:block">{a.range}</p>
                  </div>
                ))}
              </div>

              {/* Lignes — paramètres */}
              <div className="space-y-75">
                {allureParams.map(param => (
                  <div
                    key={param.key}
                    className="grid grid-cols-[52px_repeat(3,1fr)] items-center overflow-hidden rounded-xl bg-neutral-10/50 lg:grid-cols-[76px_repeat(3,1fr)]"
                  >
                    <p className="px-50 py-75 text-[9px] font-semibold leading-tight text-neutral-600 lg:px-75 lg:py-100 lg:text-[10px]">
                      {param.label}
                    </p>
                    {allures.map((a, i) => (
                      <div key={a.id} className="px-25 py-75 lg:px-75 lg:py-100">
                        <AllureCell
                          value={a[param.key] ?? ''}
                          editing={editAllures}
                          unit={param.unit}
                          kind={param.kind}
                          color={a.color}
                          onChange={v => editAllure(i, param.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Aptitudes ── */}
        <section className="widget-card p-300">
          <div className="mb-150 flex items-center justify-between">
            <p className="widget-title">Aptitudes</p>
            <EditToggleButton editing={editCompetences} onClick={() => setEditCompetences(v => !v)} />
          </div>
          <div className="space-y-150">
            {competences.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-neutral-700">{c.label}</p>
                <RatingBar value={c.value} editing={editCompetences} onChange={v => editCompetence(i, v)} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Références chronométriques ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <div className="flex items-center gap-150">
              <Timer className="size-4 text-primary-400 shrink-0" strokeWidth={2} />
              <p className="widget-title">Références chronométriques</p>
            </div>
            <EditToggleButton editing={editChronos} onClick={() => setEditChronos(v => !v)} />
          </div>
          {chronos.map((c, i) => (
            <div key={i} className="widget-row flex items-center justify-between px-200 py-150">
              <p className="text-[14px] font-bold text-neutral-800">{c.label}</p>
              {editChronos ? (
                <input
                  className="w-24 rounded-lg border border-neutral-30 bg-neutral-10 px-150 py-75 text-right text-[14px] font-bold text-primary-700 outline-none focus:border-primary-400"
                  value={c.time}
                  onChange={e => setChronos(ch => ch.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                />
              ) : (
                <p className="text-[16px] font-bold text-primary-700">{c.time}</p>
              )}
            </div>
          ))}
        </section>

        {/* ── Nutrition ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <p className="widget-title">Nutrition</p>
            <EditToggleButton editing={editNutrition} onClick={() => setEditNutrition(v => !v)} />
          </div>

          {/* Glucides + Eau */}
          <div className="grid grid-cols-1 gap-100 px-200 pb-150 sm:grid-cols-2">
            <StepperStat
              icon={<Flame className="size-4 shrink-0 text-orange-700" strokeWidth={2} />}
              label="Glucides / heure"
              value={glucidesPerHour}
              unit="g"
              editing={editNutrition}
              onDec={() => setGlucidesPerHour(g => Math.max(0, g - 5))}
              onInc={() => setGlucidesPerHour(g => g + 5)}
              color="orange"
            />
            <StepperStat
              icon={<Droplets className="size-4 shrink-0 text-teal-700" strokeWidth={2} />}
              label="Eau / heure"
              value={waterPerHour}
              unit="ml"
              editing={editNutrition}
              onDec={() => setWaterPerHour(w => Math.max(100, w - 50))}
              onInc={() => setWaterPerHour(w => w + 50)}
              color="teal"
            />
          </div>

          <p className="px-200 pt-150 pb-75 text-[10px] eyebrow text-neutral-400">
            Produits par préférence
          </p>

          {/* Column headers */}
          <div className={`grid items-center gap-x-150 px-200 pb-75 ${editNutrition ? 'grid-cols-[auto_1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto]'}`}>
            {editNutrition && <span />}
            <span />
            <p className="w-14 text-center text-[10px] eyebrow text-neutral-400">Glucides</p>
            <p className="w-12 text-center text-[10px] eyebrow text-neutral-400">Glu:Fru</p>
            {editNutrition && <span />}
          </div>

          {products.map((p, i) => {
            const isGhost = editNutrition && dragId === p.id
            return (
              <div
                key={p.id}
                ref={el => { if (el) rowRefs.current.set(p.id, el); else rowRefs.current.delete(p.id) }}
                draggable={editNutrition}
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragId(p.id) }}
                onDragOver={e => {
                  if (!editNutrition || dragId === null) return
                  e.preventDefault()
                  if (dragId === p.id || reorderLock.current) return
                  reorderLock.current = true
                  moveProductOver(p.id)
                  window.setTimeout(() => { reorderLock.current = false }, 220)
                }}
                onDrop={e => e.preventDefault()}
                onDragEnd={() => setDragId(null)}
                className={`widget-row grid items-center gap-x-150 px-200 py-150 ${editNutrition ? 'grid-cols-[auto_1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto]'} ${isGhost ? 'rounded-xl border border-dashed border-secondary-700 bg-secondary-50 opacity-50' : ''}`}
              >
                {editNutrition && <GripVertical className="size-4 shrink-0 cursor-grab text-neutral-40" strokeWidth={2} />}
                <div className="flex min-w-0 items-center gap-100">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-700 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-neutral-800">{p.name}</p>
                  <ColorTag label={categoryConfig[p.category].label} color={categoryConfig[p.category].color} size="small" />
                </div>
                <p className="w-14 text-center text-[14px] font-bold text-primary-700">
                  {p.glucides}<span className="ml-25 text-[10px] font-medium text-neutral-400">g</span>
                </p>
                <p className="w-12 text-center text-[12px] font-semibold text-neutral-600">{p.ratio}</p>
                {editNutrition && (
                  <button
                    onClick={() => setProductToDelete(i)}
                    className="btn btn-icon size-7 hover:bg-red-50! hover:text-red-500!"
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )
          })}

          {editNutrition && (
            <div className="border-t border-neutral-20 px-200 py-150">
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn btn-text gap-100 text-[12px] text-primary-600 hover:text-primary-700!"
              >
                <Plus className="size-3.5" strokeWidth={2.5} />
                Ajouter un produit
              </button>
            </div>
          )}
        </section>

      </div>

      {showAddProduct && (
        <AddProductModal
          onAdd={p => { setProducts(pr => [...pr, p]); setShowAddProduct(false) }}
          onClose={() => setShowAddProduct(false)}
        />
      )}

      {productToDelete !== null && (
        <DeleteProductModal
          productName={products[productToDelete].name}
          onConfirm={() => { setProducts(pr => pr.filter((_, j) => j !== productToDelete)); setProductToDelete(null) }}
          onClose={() => setProductToDelete(null)}
        />
      )}
    </AppLayout>
  )
}
