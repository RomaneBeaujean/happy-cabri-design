import { useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronUp, ChevronDown, TrendingUp, TrendingDown, Route, Droplets, Gauge, Zap, Timer, Pencil, Check, Plus, X,
} from 'lucide-react'
import ColorTag from '../../components/ColorTag'
import type { DerivedSegment, SegmentNutrition } from './segmentModel'
import { RUNNER_PRODUCTS, type RunnerProduct } from './mockData'
import { fmtTime, fmtQty, sanitizeQtyInput, paceToSec, secToPace } from './format'

interface Props {
  seg: DerivedSegment
  index: number
  typeLabel: string
  globalEdit: boolean
  onPaceChange: (pace: string, timeMins: number) => void
  onNutritionChange: (nutrition: SegmentNutrition) => void
}

export default function SegmentCard({ seg, index, typeLabel, globalEdit, onPaceChange, onNutritionChange }: Props) {
  const [editingPace,       setEditingPace]       = useState(false)
  const [editingNutrition,  setEditingNutrition]  = useState(false)
  const [editingWater,      setEditingWater]      = useState(false)
  const [waterDraft,        setWaterDraft]        = useState('')
  const [editingQtyIndex,   setEditingQtyIndex]    = useState<number | null>(null)
  const [qtyDraft,          setQtyDraft]           = useState('')
  const [focused,           setFocused]           = useState<string | null>(null)
  const [productMenuOpen,   setProductMenuOpen]   = useState(false)
  const [productSearch,     setProductSearch]     = useState('')
  const [menuPos,           setMenuPos]           = useState<{ top: number; left: number } | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const isPaceEditing      = editingPace || globalEdit
  const isNutritionEditing = editingNutrition || globalEdit
  const isCardEditing      = isPaceEditing || isNutritionEditing

  const localPace     = seg.pace
  const localTimeMins = seg.timeMins
  const localWater     = seg.nutrition?.water
  const localItems     = seg.nutrition?.items ?? []

  const dist         = +(seg.to - seg.from).toFixed(1)
  const kmEffort     = +(dist + seg.dp / 100).toFixed(1)
  const localVitesse = +((kmEffort / localTimeMins) * 60).toFixed(1)
  const dominantElev = Math.max(seg.dp, seg.dm)
  const avgSlope     = dist > 0 ? +((dominantElev / (dist * 1000)) * 100).toFixed(1) : 0
  const slopeColor   = seg.dm > seg.dp ? 'teal'
                     : avgSlope < 5    ? 'green'
                     : avgSlope < 10   ? 'amber'
                     : avgSlope < 15   ? 'orange'
                     : 'red'

  function changePace(secs: number) {
    const c = Math.max(30, secs)
    onPaceChange(secToPace(c), Math.round((c / 60) * kmEffort))
  }
  function changeDuration(mins: number) {
    const c = Math.max(1, mins)
    onPaceChange(secToPace(Math.round((c / kmEffort) * 60)), c)
  }
  function changeVitesse(v: number) {
    const c = Math.max(0.1, +v.toFixed(1))
    const m = Math.round((kmEffort / c) * 60)
    onPaceChange(secToPace(Math.round((m / kmEffort) * 60)), m)
  }

  function addProduct(p: RunnerProduct) {
    if (p.waterMl) {
      onNutritionChange({ ...seg.nutrition, water: p.waterMl })
    } else {
      const idx = localItems.findIndex(i => i.label === p.label)
      const items = idx >= 0
        ? localItems.map((item, j) => j === idx ? { ...item, qty: item.qty + 1 } : item)
        : [...localItems, { qty: 1, label: p.label }]
      onNutritionChange({ ...seg.nutrition, items })
    }
    setProductMenuOpen(false)
    setProductSearch('')
  }

  function startEditQty(j: number) {
    setQtyDraft(fmtQty(localItems[j].qty))
    setEditingQtyIndex(j)
  }

  function commitQty(j: number) {
    const parsed = parseFloat(qtyDraft.replace(',', '.'))
    if (Number.isFinite(parsed) && parsed > 0) {
      const items = localItems.map((item, k) => k === j ? { ...item, qty: parsed } : item)
      onNutritionChange({ ...seg.nutrition, items })
    }
    setEditingQtyIndex(null)
  }

  function removeItem(j: number) {
    onNutritionChange({ ...seg.nutrition, items: localItems.filter((_, k) => k !== j) })
  }

  function bumpQtyDraft(delta: number) {
    const current = parseFloat(qtyDraft.replace(',', '.')) || 0
    setQtyDraft(fmtQty(Math.max(0.5, +(current + delta).toFixed(2))))
  }

  function startEditWater() {
    setWaterDraft(String(localWater ?? 0))
    setEditingWater(true)
  }

  function commitWater() {
    const parsed = parseInt(waterDraft, 10)
    if (Number.isFinite(parsed) && parsed > 0) onNutritionChange({ ...seg.nutrition, water: parsed })
    setEditingWater(false)
  }

  function bumpWaterDraft(delta: number) {
    const current = parseInt(waterDraft, 10) || 0
    setWaterDraft(String(Math.max(0, current + delta)))
  }

  function openProductMenu(e: MouseEvent) {
    e.stopPropagation()
    if (menuBtnRef.current) {
      const r = menuBtnRef.current.getBoundingClientRect()
      const goAbove = r.bottom + 240 > window.innerHeight
      setMenuPos({ top: goAbove ? r.top - 244 : r.bottom + 4, left: r.left })
    }
    setProductMenuOpen(v => !v)
  }

  const filteredProducts = RUNNER_PRODUCTS.filter(p =>
    p.label.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const iCls = (id: string) => ['input pl-150 pr-[68px]', focused === id ? 'bg-primary-50/60 font-semibold' : ''].filter(Boolean).join(' ')
  const lCls = (id: string) => `text-[10px] font-semibold transition-colors ${focused === id ? 'text-primary-500' : 'text-neutral-80'}`

  const spin = (id: string, label: string, value: string, unit: string, onUp: () => void, onDown: () => void) => (
    <div className="space-y-75">
      <p className={lCls(id)}>{label}</p>
      <div className="relative">
        <input className={iCls(id)} readOnly value={value} onFocus={() => setFocused(id)} onBlur={() => setFocused(null)} />
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
  )

  const spinGrid = () => (
    <div className="grid grid-cols-3 gap-150">
      {spin(`d-${index}`, 'Durée',       fmtTime(localTimeMins),    'h',      () => changeDuration(localTimeMins + 1),          () => changeDuration(localTimeMins - 1))}
      {spin(`p-${index}`, 'Allure',      localPace,                  'min/km', () => changePace(paceToSec(localPace) - 30),      () => changePace(paceToSec(localPace) + 30))}
      {spin(`k-${index}`, 'km-effort/h', localVitesse.toFixed(1),   'ke/h',   () => changeVitesse(localVitesse + 0.1),           () => changeVitesse(localVitesse - 0.1))}
    </div>
  )

  const smallBtn = (onClick: (e: MouseEvent) => void, children: React.ReactNode) => (
    <button
      className="flex size-[22px] items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-neutral-40 hover:text-neutral-600"
      onClick={onClick}
    >
      {children}
    </button>
  )

  const nutritionContent = (editing: boolean) => (
    <div className="flex flex-wrap gap-75">
      {localWater && (
        editing && editingWater ? (
          <div className="flex h-[26px] shrink-0 items-center gap-25 rounded-full bg-teal-50 px-100 text-[12px] font-medium text-teal-800">
            <Droplets className="size-3 shrink-0" strokeWidth={2} />
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={waterDraft}
              onChange={e => setWaterDraft(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onBlur={commitWater}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
              style={{ width: `${Math.max(1, waterDraft.length)}ch` }}
              className="shrink-0 border-none bg-transparent p-0 text-left text-[12px] font-medium text-teal-800 outline-none"
            />
            <div className="flex flex-col items-center">
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => bumpWaterDraft(50)} className="flex items-center text-teal-400 transition-colors hover:text-teal-700">
                <ChevronUp className="size-[9px]" strokeWidth={2.5} />
              </button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => bumpWaterDraft(-50)} className="flex items-center text-teal-400 transition-colors hover:text-teal-700">
                <ChevronDown className="size-[9px]" strokeWidth={2.5} />
              </button>
            </div>
            <span className="shrink-0">mL</span>
            <button
              type="button"
              onClick={commitWater}
              className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
            >
              <Check className="size-[9px]" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <ColorTag
            color="teal"
            icon={<Droplets className="size-3" strokeWidth={2} />}
            label={`${localWater} mL`}
            onClick={editing ? startEditWater : undefined}
          />
        )
      )}
      {localItems.map((item, j) => (
        editing && editingQtyIndex === j ? (
          <div key={j} className="flex h-[26px] shrink-0 items-center gap-25 rounded-full bg-lime-50 px-100 text-[12px] font-medium text-lime-800">
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={qtyDraft}
              onChange={e => setQtyDraft(sanitizeQtyInput(e.target.value))}
              onBlur={() => commitQty(j)}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
              style={{ width: `${Math.max(1, qtyDraft.length)}ch` }}
              className="shrink-0 border-none bg-transparent p-0 text-left text-[12px] font-medium text-lime-800 outline-none"
            />
            <div className="flex flex-col items-center">
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => bumpQtyDraft(1)} className="flex items-center text-lime-400 transition-colors hover:text-lime-700">
                <ChevronUp className="size-[9px]" strokeWidth={2.5} />
              </button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => bumpQtyDraft(-1)} className="flex items-center text-lime-400 transition-colors hover:text-lime-700">
                <ChevronDown className="size-[9px]" strokeWidth={2.5} />
              </button>
            </div>
            <span className="shrink-0">{item.label}</span>
            <button
              type="button"
              onClick={() => commitQty(j)}
              className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
            >
              <Check className="size-[9px]" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <ColorTag
            key={j}
            color="lime"
            icon={<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold">{fmtQty(item.qty)}</span>}
            label={item.label}
            rightIcon={editing ? <X className="size-[9px]" strokeWidth={2.5} /> : undefined}
            onRightIconClick={editing ? () => removeItem(j) : undefined}
            onClick={editing ? () => startEditQty(j) : undefined}
          />
        )
      ))}
      {editing && (
        <button
          ref={menuBtnRef}
          type="button"
          onClick={openProductMenu}
          className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-neutral-30 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Plus className="size-[11px]" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )

  const leftBorderColor = seg.dm > seg.dp
    ? 'var(--color-secondary-500)'
    : 'var(--color-primary-500)'

  return (
    <div
      className="widget-card overflow-hidden transition-[background-image] duration-200"
      style={isCardEditing ? { backgroundImage: 'linear-gradient(rgba(248, 217, 122, 0.12), rgba(248, 217, 122, 0.12))' } : undefined}
    >
      <div className="flex">
        <div className="w-[5px] shrink-0" style={{ backgroundColor: leftBorderColor }} />
        <div className="min-w-0 flex-1">

      {/* En-tête */}
      <div className="flex items-start gap-150 px-200 pb-150 pt-200">
        <div
          className="mt-25 flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-neutral-0"
          style={{ backgroundColor: leftBorderColor }}
        >
          {index + 1}
        </div>
        <div className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{typeLabel}</p>
          <p className="text-[14px] font-bold text-neutral-800">{seg.from} → {seg.to} km</p>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-75">
          <ColorTag color="secondary" icon={<Route       className="size-3" strokeWidth={2} />} label={`${dist} km`} />
          {seg.dp > 0 && <ColorTag color="orange" icon={<TrendingUp   className="size-3" strokeWidth={2} />} label={`+${seg.dp.toLocaleString('fr')} m`} />}
          {seg.dm > 0 && <ColorTag color="green"  icon={<TrendingDown className="size-3" strokeWidth={2} />} label={`−${seg.dm.toLocaleString('fr')} m`} />}
          <ColorTag
            color={slopeColor}
            icon={seg.dm > seg.dp ? <TrendingDown className="size-3" strokeWidth={2} /> : <TrendingUp className="size-3" strokeWidth={2} />}
            label={`${seg.dm > seg.dp ? '−' : '+'}${avgSlope}%`}
          />
        </div>
      </div>

      {/* Corps */}
      <div className="px-200 pb-200">
        <div className="h-px bg-neutral-40" />

        {globalEdit ? (
          /* ── Édition globale: allures + nutrition empilés pleine largeur ── */
          <div className="mt-150 space-y-200">
            <div className="space-y-100">
              <p className="widget-label">Allures</p>
              {spinGrid()}
            </div>
            <div className="h-px bg-neutral-40" />
            <div className="space-y-100">
              <p className="widget-label">Nutrition</p>
              {nutritionContent(true)}
            </div>
          </div>

        ) : isPaceEditing ? (
          /* ── Édition allures individuelle ── */
          <div className="mt-150 space-y-150">
            {spinGrid()}
            <button className="btn btn-primary w-full" onClick={e => { e.stopPropagation(); setEditingPace(false) }}>
              <Check className="size-4" strokeWidth={2.5} />
              Terminé
            </button>
          </div>

        ) : isNutritionEditing ? (
          /* ── Édition nutrition individuelle ── */
          <div className="mt-150 space-y-150">
            <div className="space-y-100">
              <p className="widget-label">Nutrition</p>
              {nutritionContent(true)}
            </div>
            <button className="btn btn-primary w-full" onClick={e => { e.stopPropagation(); setEditingNutrition(false) }}>
              <Check className="size-4" strokeWidth={2.5} />
              Terminé
            </button>
          </div>

        ) : (
          /* ── Affichage 50/50 ── */
          <div className="mt-150 flex items-stretch gap-0">
            {/* Allures */}
            <div className="flex min-w-0 flex-1 flex-col gap-100 pr-150">
              <div className="flex items-center justify-between">
                <p className="widget-label">Allures</p>
                {smallBtn(e => { e.stopPropagation(); setEditingPace(true) }, <Pencil className="size-[11px]" strokeWidth={2} />)}
              </div>
              <div className="flex flex-wrap gap-75">
                <ColorTag color="pink"        icon={<Gauge className="size-3" strokeWidth={2} />} label={`${localPace} /km`} />
                <ColorTag color="deep-purple" icon={<Zap   className="size-3" strokeWidth={2} />} label={`${localVitesse} km-e/h`} />
                <ColorTag color="teal"        icon={<Timer className="size-3" strokeWidth={2} />} label={fmtTime(localTimeMins).replace(' ', '')} />
              </div>
            </div>

            <div className="w-px shrink-0 bg-neutral-40" />

            {/* Nutrition */}
            <div className="flex min-w-0 flex-1 flex-col gap-100 pl-150">
              <div className="flex items-center justify-between">
                <p className="widget-label">Nutrition</p>
                {isNutritionEditing
                  ? smallBtn(e => { e.stopPropagation(); setEditingNutrition(false) }, <Check  className="size-[11px]" strokeWidth={2.5} />)
                  : smallBtn(e => { e.stopPropagation(); setEditingNutrition(true)  }, <Pencil className="size-[11px]" strokeWidth={2}   />)
                }
              </div>
              {nutritionContent(isNutritionEditing)}
            </div>
          </div>
        )}
      </div>

        </div>
      </div>

      {/* Menu produits — portal pour sortir du overflow:hidden */}
      {productMenuOpen && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setProductMenuOpen(false)} />
          <div
            className="fixed z-[999] w-[220px] overflow-hidden rounded-2xl border border-neutral-20 bg-white shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <div className="border-b border-neutral-20 p-100">
              <input
                autoFocus
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="input py-75 text-[12px]"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {filteredProducts.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className="flex w-full items-center justify-between px-200 py-100 text-left hover:bg-neutral-20"
                  onClick={e => { e.stopPropagation(); addProduct(p) }}
                >
                  <span className="text-[13px] text-neutral-700">{p.label}</span>
                  <span className="ml-100 shrink-0 text-[10px] text-neutral-300">{p.category}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="px-200 py-150 text-center text-[12px] text-neutral-300">Aucun produit</p>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
