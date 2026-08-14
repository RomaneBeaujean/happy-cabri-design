import { useState, useRef, useLayoutEffect, useSyncExternalStore, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  Edit2, GripVertical, Droplets, ChevronUp, ChevronDown, Save,
  Plus, Minus, X, Flame, AlertTriangle, Trash2, Camera,
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import ColorTag, { type TagColor } from '../components/ColorTag'
import Dropdown from '../components/Dropdown'
import { getAvatarUrl, setAvatarUrl, subscribeAvatarUrl } from '../stores/userAvatar'

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

type ProductCategory = 'gel' | 'barre' | 'compote' | 'boisson' | 'autre'

const categoryConfig: Record<ProductCategory, { label: string; color: TagColor }> = {
  gel:     { label: 'Gel',     color: 'orange'  },
  barre:   { label: 'Barre',   color: 'brown'   },
  compote: { label: 'Compote', color: 'green'   },
  boisson: { label: 'Boisson', color: 'teal'    },
  autre:   { label: 'Autre',   color: 'white'   },
}

type Product = { id: string; name: string; glucides: number; ratio: string; category: ProductCategory }

const initProducts: Product[] = [
  { id: 'p1', name: 'Maurten Gel 100',             glucides: 25, ratio: '1:0.8', category: 'gel'     },
  { id: 'p2', name: 'Spring Energy Awesome Sauce', glucides: 45, ratio: '2:1',   category: 'gel'     },
  { id: 'p3', name: 'Tailwind Endurance Fuel',     glucides: 50, ratio: '2:1',   category: 'boisson' },
  { id: 'p4', name: 'Clémentines fraîches',        glucides: 12, ratio: '1:1',   category: 'autre'   },
]

export const initAllures = [
  { id: 'courte', label: 'Courte', range: '< 25 km',    color: 'text-[#C3BBAD]', dot: 'bg-[#C3BBAD]', max: '4:15', min: '10:00', plat: '4:45', descenteTechnique: '6:30', kmEffort: '15' },
  { id: 'longue', label: 'Longue', range: '25 – 60 km', color: 'text-[#87775A]', dot: 'bg-[#87775A]', max: '4:40', min: '12:30', plat: '5:10', descenteTechnique: '7:30', kmEffort: '10' },
  { id: 'ultra',  label: 'Ultra',  range: '> 60 km',     color: 'text-[#433523]', dot: 'bg-[#433523]', max: '5:10', min: '15:00', plat: '5:40', descenteTechnique: '9:00', kmEffort: '6'  },
]

export type AllureRow = typeof initAllures[number]

export const allureParams: { key: 'max' | 'min' | 'plat' | 'descenteTechnique' | 'kmEffort'; label: string; unit: string; kind: 'pace' | 'number' }[] = [
  { key: 'min',               label: 'Allure la plus rapide sur 300m',   unit: '/km', kind: 'pace'   },
  { key: 'plat',              label: 'Allure à plat',                    unit: '/km', kind: 'pace'   },
  { key: 'descenteTechnique', label: 'Descente raide (>20%)',            unit: '/km', kind: 'pace'   },
  { key: 'max',               label: 'Montée raide (>20%)',              unit: '/km', kind: 'pace'   },
  { key: 'kmEffort',          label: 'Km-effort moyen',                  unit: '',    kind: 'number' },
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
      <div className="input flex min-w-0 flex-1 items-center gap-75 py-50 pr-50">
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
          className="w-full min-w-0 flex-1 bg-transparent text-left text-[14px] font-bold text-neutral-800 outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-neutral-60"
        />
        <div className="flex shrink-0 items-center gap-25">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); bump(-1) }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 transition-colors hover:bg-secondary-300"
          >
            <Minus className="size-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); bump(1) }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-800 transition-colors hover:bg-secondary-300"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
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

function StepperStat({ icon, label, value, unit, editing, onInc, onDec, color = 'orange' }: {
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

function AddProductModal({ initial, onAdd, onClose }: {
  initial?: Product
  onAdd: (p: Product) => void
  onClose: () => void
}) {
  const [category, setCategory]         = useState<ProductCategory>(initial?.category ?? 'gel')
  const [name, setName]                 = useState(initial?.name ?? '')
  const [mode, setMode]                 = useState<'unit' | '100g'>('unit')
  const [glucidesUnit, setGlucidesUnit] = useState(initial ? String(initial.glucides) : '')
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
    onAdd({
      id: initial?.id ?? `p${Date.now()}`,
      name: name.trim(),
      glucides: Math.round(finalGlucides),
      ratio: initial?.ratio ?? '—',
      category,
    })
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe max-h-[calc(100vh-24px)] w-full max-w-[420px] overflow-x-hidden overflow-y-auto rounded-3xl shadow-lg">
          <div className="flex items-center justify-between px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">
              {initial ? 'Modifier le produit' : 'Ajouter un produit'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="px-200 py-200">
            <div className="widget-card-glass space-y-200 p-200">
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
                  <div className="grid grid-cols-[1fr_auto] items-center gap-x-75 gap-y-75">
                    <NumberField
                      placeholder="glucides/100g"
                      value={glucides100g}
                      onChange={setGlucides100g}
                      variant="pill"
                    />
                    <span className="shrink-0 text-[12px] font-medium text-neutral-400">/100g</span>
                    <NumberField
                      placeholder="poids total"
                      value={weight}
                      onChange={setWeight}
                      step={5}
                      variant="pill"
                    />
                    <span className="shrink-0 text-[12px] font-medium text-neutral-400">g</span>
                    <div className="col-span-2 flex items-center gap-75">
                      <span className="shrink-0 text-[13px] font-bold text-neutral-400">=</span>
                      <span className="w-14 shrink-0 text-center text-[13px] font-bold text-primary-700">
                        {computedFrom100g != null ? `${computedFrom100g} g` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
              {initial ? 'Enregistrer' : 'Ajouter'}
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
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="max-h-[calc(100vh-24px)] w-full max-w-[380px] overflow-x-hidden overflow-y-auto rounded-3xl bg-white shadow-lg">
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const avatarUrl = useSyncExternalStore(subscribeAvatarUrl, getAvatarUrl)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const prevRects = useRef(new Map<string, DOMRect>())
  const reorderLock = useRef(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const prev = getAvatarUrl()
    if (prev) URL.revokeObjectURL(prev)
    setAvatarUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

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
          <div className="flex items-center gap-300">
            <div className="relative shrink-0">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary-500 text-[24px] font-bold text-neutral-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="size-full object-cover" />
                  : 'RB'}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label={avatarUrl ? 'Modifier la photo' : 'Ajouter une photo'}
                className="absolute right-0 bottom-0 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-neutral-30 bg-white text-neutral-50 transition-colors hover:bg-neutral-10"
              >
                <Camera className="size-3" strokeWidth={2.5} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <h1 className="text-[24px] font-extrabold text-neutral-800">Romane Beaujean</h1>
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

          {/* Column headers — colonnes à largeur fixe (et non "auto") pour que les repères
              (drag/actions, vides ici) matchent exactement la largeur de leur équivalent rempli
              dans les lignes ci-dessous ; avec des colonnes "auto", une case vide dans l'en-tête
              et une case avec une icône dans la ligne n'ont pas la même largeur calculée, ce qui
              décale Glucides par rapport aux valeurs. */}
          <div className={`grid items-center gap-x-150 px-200 pb-75 ${editNutrition ? 'grid-cols-[24px_1fr_56px_60px]' : 'grid-cols-[1fr_56px]'}`}>
            {editNutrition && <span />}
            <span />
            <p className="text-center text-[10px] eyebrow text-neutral-400">Glucides</p>
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
                className={`widget-row group grid items-center gap-x-150 px-200 py-150 ${editNutrition ? 'grid-cols-[24px_1fr_56px_60px]' : 'grid-cols-[1fr_56px]'} ${isGhost ? 'rounded-xl border border-dashed border-secondary-700 bg-secondary-50 opacity-50' : ''}`}
              >
                {editNutrition && (
                  <GripVertical className="size-4 shrink-0 cursor-grab text-neutral-40 transition-colors group-hover:text-neutral-500" strokeWidth={2} />
                )}
                <div className="flex min-w-0 items-center gap-100">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <ColorTag label={categoryConfig[p.category].label} color={categoryConfig[p.category].color} size="small" />
                  <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-neutral-800">{p.name}</p>
                </div>
                <p className="text-center text-[14px] font-bold text-primary-700">
                  {p.glucides}<span className="ml-25 text-[10px] font-medium text-neutral-400">g</span>
                </p>
                {editNutrition && (
                  <div className="flex items-center justify-end gap-50">
                    <button
                      onClick={() => setEditingProductId(p.id)}
                      className="btn btn-icon size-7 text-secondary-700 hover:bg-secondary-100! hover:text-secondary-800!"
                    >
                      <Edit2 className="size-3.5" strokeWidth={2} />
                    </button>
                    <div className="group/tooltip relative">
                      <button
                        onClick={() => setProductToDelete(i)}
                        className="btn btn-icon size-7 text-secondary-700 hover:bg-secondary-100! hover:text-secondary-800!"
                      >
                        <Trash2 className="size-3.5" strokeWidth={2} />
                      </button>
                      <span className="pointer-events-none absolute right-1/2 bottom-full mb-50 translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-75 py-25 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                        Supprimer
                      </span>
                    </div>
                  </div>
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

      {editingProductId !== null && (
        <AddProductModal
          initial={products.find(p => p.id === editingProductId)}
          onAdd={updated => { setProducts(pr => pr.map(p => p.id === updated.id ? updated : p)); setEditingProductId(null) }}
          onClose={() => setEditingProductId(null)}
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
