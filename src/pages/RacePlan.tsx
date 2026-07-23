import { useState, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Link2,
  MapPin, Calendar, Clock, Route, Droplets, Gauge, Zap, Pencil, Check, Plus, X,
  Rows2, Columns2,
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import type { AltimetryPoint } from '../components/AltimetryChart'
import SlopeAltimetryChart from '../components/SlopeAltimetryChart'
import RouteMap from '../components/RouteMap'
import ColorTag from '../components/ColorTag'

// ── Données mock ───────────────────────────────────────────────────────────────
const ALT_DATA: AltimetryPoint[] = [
  { km: 0,   alt: 180 }, { km: 4,   alt: 620 }, { km: 8,   alt: 1400 },
  { km: 12,  alt: 2100 }, { km: 15,  alt: 2480 }, { km: 18,  alt: 1700 },
  { km: 22,  alt: 900 },  { km: 26,  alt: 1600 }, { km: 30,  alt: 2300 },
  { km: 34,  alt: 2700 }, { km: 37,  alt: 2200 }, { km: 41,  alt: 1300 },
  { km: 45,  alt: 600 },  { km: 49,  alt: 400 },  { km: 53,  alt: 900 },
  { km: 57,  alt: 1800 }, { km: 61,  alt: 2400 }, { km: 65,  alt: 2874 },
  { km: 68,  alt: 2500 }, { km: 72,  alt: 1600 }, { km: 76,  alt: 800 },
  { km: 80,  alt: 300 },  { km: 84,  alt: 700 },  { km: 88,  alt: 1500 },
  { km: 92,  alt: 2200 }, { km: 96,  alt: 2600 }, { km: 100, alt: 2874 },
  { km: 103, alt: 2300 }, { km: 107, alt: 1500 }, { km: 111, alt: 700 },
  { km: 115, alt: 1100 }, { km: 119, alt: 2000 }, { km: 123, alt: 2500 },
  { km: 127, alt: 2800 }, { km: 130, alt: 2400 }, { km: 134, alt: 1600 },
  { km: 138, alt: 900 },  { km: 142, alt: 1400 }, { km: 146, alt: 2100 },
  { km: 150, alt: 2600 }, { km: 154, alt: 2874 }, { km: 158, alt: 2200 },
  { km: 162, alt: 1400 }, { km: 166, alt: 600 },  { km: 171, alt: 180 },
]

const SEG_KMS = [7, 14, 22, 30, 37, 45, 53, 61, 68, 76, 84, 92, 100, 107, 115, 123, 130, 138, 146, 154, 158, 162, 166]

// Marqueurs de ravitaillement — environ tous les 15 km
const RAVITO_KMS = [14, 30, 45, 61, 76, 92, 107, 123, 138, 154, 166]

// ── Interfaces ─────────────────────────────────────────────────────────────────
interface NutritionItem { qty: number; label: string }

interface SegmentNutrition {
  water?: number        // mL
  items?: NutritionItem[]
}

interface Segment {
  from: number; to: number
  dp: number; dm: number
  pace: string; timeMins: number
  nutrition?: SegmentNutrition
}

// ── Données segments ───────────────────────────────────────────────────────────
const SEGMENTS: Segment[] = [
  { from: 0,   to: 7,   dp: 1025, dm: 0,    pace: '11:20', timeMins: 76,
    nutrition: { water: 250 } },
  { from: 7,   to: 14,  dp: 1148, dm: 0,    pace: '12:00', timeMins: 82,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Maurten 160' }] } },
  { from: 14,  to: 22,  dp: 0,    dm: 1453, pace: '8:00',  timeMins: 64,
    nutrition: { water: 500 } },
  { from: 22,  to: 30,  dp: 1400, dm: 0,    pace: '11:00', timeMins: 88,
    nutrition: { water: 500, items: [{ qty: 1, label: 'Gel Maurten 160' }, { qty: 1, label: "Pom Pot'" }] } },
  { from: 30,  to: 37,  dp: 200,  dm: 300,  pace: '9:30',  timeMins: 66,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Barre Overstim' }] } },
  { from: 37,  to: 45,  dp: 0,    dm: 1600, pace: '7:30',  timeMins: 60,
    nutrition: { water: 500 } },
  { from: 45,  to: 53,  dp: 300,  dm: 0,    pace: '9:00',  timeMins: 72,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Powerbar' }] } },
  { from: 53,  to: 61,  dp: 1500, dm: 0,    pace: '11:30', timeMins: 88,
    nutrition: { water: 500, items: [{ qty: 2, label: 'Gomme Ta Energy' }, { qty: 1, label: "Pom Pot'" }] } },
  { from: 61,  to: 68,  dp: 200,  dm: 100,  pace: '9:30',  timeMins: 66,
    nutrition: { water: 250 } },
  { from: 68,  to: 76,  dp: 0,    dm: 1700, pace: '8:30',  timeMins: 68,
    nutrition: { water: 500 } },
  { from: 76,  to: 84,  dp: 200,  dm: 300,  pace: '9:20',  timeMins: 74,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Maurten 160' }] } },
  { from: 84,  to: 92,  dp: 1500, dm: 0,    pace: '11:30', timeMins: 88,
    nutrition: { water: 500, items: [{ qty: 1, label: 'Barre Overstim' }, { qty: 1, label: "Pom Pot'" }] } },
  { from: 92,  to: 100, dp: 674,  dm: 0,    pace: '10:30', timeMins: 80,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Powerbar' }] } },
  { from: 100, to: 107, dp: 0,    dm: 1374, pace: '8:00',  timeMins: 56,
    nutrition: { water: 500 } },
  { from: 107, to: 115, dp: 0,    dm: 400,  pace: '8:30',  timeMins: 68,
    nutrition: { water: 250 } },
  { from: 115, to: 123, dp: 1400, dm: 0,    pace: '11:00', timeMins: 88,
    nutrition: { water: 500, items: [{ qty: 1, label: 'Gel Maurten 160' }, { qty: 1, label: "Pom Pot'" }] } },
  { from: 123, to: 130, dp: 200,  dm: 300,  pace: '9:30',  timeMins: 66,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Powerbar' }] } },
  { from: 130, to: 138, dp: 0,    dm: 1500, pace: '7:30',  timeMins: 60,
    nutrition: { water: 500 } },
  { from: 138, to: 146, dp: 1200, dm: 0,    pace: '11:00', timeMins: 84,
    nutrition: { water: 500, items: [{ qty: 2, label: 'Gomme Ta Energy' }, { qty: 1, label: "Pom Pot'" }] } },
  { from: 146, to: 154, dp: 774,  dm: 0,    pace: '10:30', timeMins: 80,
    nutrition: { water: 250, items: [{ qty: 1, label: 'Gel Maurten 160' }] } },
  { from: 154, to: 158, dp: 0,    dm: 674,  pace: '8:00',  timeMins: 32,
    nutrition: { water: 250 } },
  { from: 158, to: 162, dp: 0,    dm: 800,  pace: '7:30',  timeMins: 30,
    nutrition: { water: 250 } },
  { from: 162, to: 166, dp: 0,    dm: 800,  pace: '7:30',  timeMins: 30,
    nutrition: { water: 250 } },
  { from: 166, to: 171, dp: 0,    dm: 420,  pace: '7:30',  timeMins: 37,
    nutrition: { water: 250 } },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}` : `${m} min`
}

function fmtDateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getBarColor(seg: Segment): string {
  return seg.dm > seg.dp ? '#6AAF7E' : '#E53935'
}

function interpolateAlt(km: number): number {
  if (km <= ALT_DATA[0].km) return ALT_DATA[0].alt
  if (km >= ALT_DATA[ALT_DATA.length - 1].km) return ALT_DATA[ALT_DATA.length - 1].alt
  let idx = 0
  while (idx < ALT_DATA.length - 2 && ALT_DATA[idx + 1].km <= km) idx++
  const p0 = ALT_DATA[idx], p1 = ALT_DATA[idx + 1]
  const t = (km - p0.km) / (p1.km - p0.km)
  return Math.round(p0.alt + t * (p1.alt - p0.alt))
}

function getSegmentAltData(seg: Segment): AltimetryPoint[] {
  const pts: AltimetryPoint[] = [{ km: 0, alt: interpolateAlt(seg.from) }]
  for (const p of ALT_DATA) {
    if (p.km > seg.from && p.km < seg.to) {
      pts.push({ km: +(p.km - seg.from).toFixed(1), alt: p.alt })
    }
  }
  pts.push({ km: +(seg.to - seg.from).toFixed(1), alt: interpolateAlt(seg.to) })
  return pts
}

// ── Produits du coureur ────────────────────────────────────────────────────────
interface RunnerProduct { label: string; category: string; waterMl?: number }

const RUNNER_PRODUCTS: RunnerProduct[] = [
  { label: 'Gel Maurten 160',     category: 'Gel' },
  { label: 'Gel SiS Beta Fuel',   category: 'Gel' },
  { label: 'Gel Powerbar',        category: 'Gel' },
  { label: 'Barre Overstim',      category: 'Barre' },
  { label: 'Barre Clif',          category: 'Barre' },
  { label: 'Gomme Ta Energy',     category: 'Gomme' },
  { label: "Pom Pot'",            category: 'Compote' },
  { label: 'Banane',              category: 'Fruit' },
  { label: 'Gâteau de riz',       category: 'Salé' },
  { label: 'Coca Cola',           category: 'Boisson' },
  { label: 'Bouillon de légumes', category: 'Chaud' },
  { label: 'Eau',                 category: 'Boisson', waterMl: 500 },
]

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RacePlan() {
  const [globalEdit, setGlobalEdit] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(true)
  const [sideBySide, setSideBySide] = useState(false)
  const [ravitoKms, setRavitoKms] = useState<Set<number>>(() => new Set(RAVITO_KMS))

  function toggleRavito(km: number) {
    setRavitoKms(prev => {
      const next = new Set(prev)
      if (next.has(km)) next.delete(km)
      else next.add(km)
      return next
    })
  }

  const [headerGlobalEdit, setHeaderGlobalEdit] = useState(false)
  const [localTitle,    setLocalTitle]    = useState('Grand Raid de La Réunion')
  const [localLocation, setLocalLocation] = useState('La Réunion')
  const [localDate,     setLocalDate]     = useState('2027-08-04')
  const [localTime,     setLocalTime]     = useState('10:00')

  const typeLabels = (() => {
    const counts = { montée: 0, descente: 0, plat: 0 }
    return SEGMENTS.map(seg => {
      const t = seg.dp > seg.dm ? 'montée' as const
               : seg.dm > seg.dp ? 'descente' as const
               : 'plat' as const
      counts[t]++
      return t === 'montée'   ? `Montée ${counts.montée}`
           : t === 'descente' ? `Descente ${counts.descente}`
           : `Plat ${counts.plat}`
    })
  })()

  return (
    <AppLayout activeItem="plans" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300 pb-400">

        {/* ── Header ── */}
        <section className="pt-100">
          <div className="mb-200 flex items-center justify-between gap-200">
            <button onClick={() => navigate('/plans')} className="btn btn-text -ml-100">
              <ChevronLeft className="size-4" strokeWidth={2.5} />
              Plans de course
            </button>
            <div className="flex shrink-0 items-center gap-100">
              <button
                type="button"
                onClick={() => setHeaderGlobalEdit(v => !v)}
                className="btn btn-ghost rounded-xl border border-neutral-40 px-[10px] text-neutral-600 hover:border-neutral-60 hover:text-neutral-800 lg:px-200"
              >
                {headerGlobalEdit
                  ? <Check   className="size-4" strokeWidth={2.5} />
                  : <Pencil  className="size-4" strokeWidth={2} />}
                <span className="hidden lg:inline">{headerGlobalEdit ? 'Enregistrer' : 'Modifier'}</span>
              </button>
              <button className="btn btn-ghost shrink-0 rounded-xl border border-neutral-40 px-[10px] text-neutral-600 hover:border-neutral-60 hover:text-neutral-800 lg:px-200">
                <Link2 className="size-4" strokeWidth={2} />
                <span className="hidden lg:inline">CrewLink</span>
              </button>
            </div>
          </div>

          {headerGlobalEdit ? (
            <input
              autoFocus
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              className="input w-full py-100 text-[18px] font-extrabold text-neutral-800 lg:text-[22px]"
            />
          ) : (
            <h1 className="text-[22px] font-extrabold leading-tight text-neutral-800 lg:text-[26px]">
              {localTitle}
            </h1>
          )}

          <div className="mt-150 flex flex-wrap items-center gap-100">
            {headerGlobalEdit ? (
              <input
                value={localLocation}
                onChange={e => setLocalLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                placeholder="Lieu"
                className="input h-[26px] w-[140px] rounded-full px-150 py-0 text-[12px]"
              />
            ) : (
              <ColorTag color="cyan" icon={<MapPin className="size-3" strokeWidth={2} />} label={localLocation} />
            )}

            {headerGlobalEdit ? (
              <div className="flex items-center gap-50">
                <input
                  type="date"
                  value={localDate}
                  onChange={e => setLocalDate(e.target.value)}
                  className="input h-[26px] w-[150px] rounded-full px-150 py-0 text-[12px]"
                />
                <input
                  type="time"
                  value={localTime}
                  onChange={e => setLocalTime(e.target.value)}
                  className="input h-[26px] w-[90px] rounded-full px-150 py-0 text-[12px]"
                />
              </div>
            ) : (
              <ColorTag
                color="purple"
                icon={<Calendar className="size-3" strokeWidth={2} />}
                label={`${fmtDateFr(localDate)} · ${localTime.replace(':', 'h')}`}
              />
            )}
          </div>
          <div className="mt-100 flex flex-wrap gap-100">
            <ColorTag color="secondary" icon={<Route        className="size-3" strokeWidth={2} />} label="171 km" />
            <ColorTag color="orange"    icon={<TrendingUp   className="size-3" strokeWidth={2} />} label="+10 060 m" />
            <ColorTag color="green"     icon={<TrendingDown className="size-3" strokeWidth={2} />} label="−10 060 m" />
          </div>
        </section>

        {/* ── Profil et carte ── */}
        <div className="widget-card px-300 py-300">
          <div
            className="flex cursor-pointer items-center justify-between gap-100"
            onClick={() => setProfileExpanded(v => !v)}
          >
            <p className="widget-title shrink-0">Profil et carte</p>
            <div className="flex items-center gap-150">
              {profileExpanded && (
                <div
                  className="hidden items-center gap-25 rounded-full border border-neutral-40 bg-white p-25 lg:flex"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Affichage empilé"
                    aria-pressed={!sideBySide}
                    onClick={() => setSideBySide(false)}
                    className={`flex size-[26px] items-center justify-center rounded-full transition-colors ${
                      !sideBySide ? 'bg-primary-500 text-white' : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Rows2 className="size-[14px]" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label="Affichage côte à côte"
                    aria-pressed={sideBySide}
                    onClick={() => setSideBySide(true)}
                    className={`flex size-[26px] items-center justify-center rounded-full transition-colors ${
                      sideBySide ? 'bg-primary-500 text-white' : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Columns2 className="size-[14px]" strokeWidth={2} />
                  </button>
                </div>
              )}
              <ChevronDown
                className={`size-4 shrink-0 text-neutral-300 transition-transform duration-200${profileExpanded ? ' rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>
          </div>
          {profileExpanded && (
            <div className={sideBySide ? 'mt-200 flex flex-col gap-300 lg:grid lg:grid-cols-2 lg:items-start' : 'mt-200 flex flex-col gap-300'}>
              <SlopeAltimetryChart data={ALT_DATA} height={200} segments={SEG_KMS} distanceStep={20} />
              <div className="overflow-hidden rounded-2xl">
                <RouteMap height={320} />
              </div>
            </div>
          )}
        </div>

        {/* ── Segments ── */}
        <section className="space-y-150">
          <div className="flex items-center justify-between">
            <h2 className="font-accent text-[18px] font-extrabold text-neutral-800">Segments</h2>
            {globalEdit ? (
              <button className="btn btn-primary" onClick={() => setGlobalEdit(false)}>
                <Check className="size-4" strokeWidth={2.5} />
                Enregistrer
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setGlobalEdit(true)}>
                <Pencil className="size-4" strokeWidth={2} />
                Modifier les segments
              </button>
            )}
          </div>

          <div className="relative space-y-100">
            {/* Rail vertical continu, au centre */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-neutral-60" />

            {SEGMENTS.map((seg, i) => (
              <Fragment key={i}>
                <SegmentCard seg={seg} index={i} typeLabel={typeLabels[i]} globalEdit={globalEdit} />
                {i < SEGMENTS.length - 1 && (
                  <SegmentSeparator
                    km={seg.to}
                    isRavito={ravitoKms.has(seg.to)}
                    onToggleRavito={() => toggleRavito(seg.to)}
                    globalEdit={globalEdit}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  )
}

// ── Segment card ───────────────────────────────────────────────────────────────
function paceToSec(pace: string): number {
  const [min, sec] = pace.split(':').map(Number)
  return (isNaN(min) ? 0 : min * 60) + (isNaN(sec) ? 0 : sec)
}
function secToPace(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function SegmentCard({ seg, index, typeLabel, globalEdit }: {
  seg: Segment; index: number; typeLabel: string; globalEdit: boolean
}) {
  const [expanded,          setExpanded]          = useState(false)
  const [editingPace,       setEditingPace]       = useState(false)
  const [editingNutrition,  setEditingNutrition]  = useState(false)
  const [localPace,         setLocalPace]         = useState(seg.pace)
  const [localTimeMins,     setLocalTimeMins]     = useState(seg.timeMins)
  const [localWater,        setLocalWater]        = useState(seg.nutrition?.water)
  const [localItems,        setLocalItems]        = useState<NutritionItem[]>(seg.nutrition?.items ?? [])
  const [focused,           setFocused]           = useState<string | null>(null)
  const [productMenuOpen,   setProductMenuOpen]   = useState(false)
  const [productSearch,     setProductSearch]     = useState('')
  const [menuPos,           setMenuPos]           = useState<{ top: number; left: number } | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const isPaceEditing      = editingPace || globalEdit
  const isNutritionEditing = editingNutrition || globalEdit

  const dist         = seg.to - seg.from
  const kmEffort     = +(dist + seg.dp / 100).toFixed(1)
  const localVitesse = +((kmEffort / localTimeMins) * 60).toFixed(1)
  const dominantElev = Math.max(seg.dp, seg.dm)
  const avgSlope     = dist > 0 ? +((dominantElev / (dist * 1000)) * 100).toFixed(1) : 0
  const slopeColor   = seg.dm > seg.dp ? 'teal'
                     : avgSlope < 5    ? 'green'
                     : avgSlope < 10   ? 'amber'
                     : avgSlope < 15   ? 'orange'
                     : 'red'
  const segAltData   = getSegmentAltData(seg)
  const distStep     = Math.max(1, Math.round(dist / 4))

  function changePace(secs: number) {
    const c = Math.max(30, secs)
    setLocalPace(secToPace(c))
    setLocalTimeMins(Math.round((c / 60) * kmEffort))
  }
  function changeDuration(mins: number) {
    const c = Math.max(1, mins)
    setLocalTimeMins(c)
    setLocalPace(secToPace(Math.round((c / kmEffort) * 60)))
  }
  function changeVitesse(v: number) {
    const c = Math.max(0.1, +v.toFixed(1))
    const m = Math.round((kmEffort / c) * 60)
    setLocalTimeMins(m)
    setLocalPace(secToPace(Math.round((m / kmEffort) * 60)))
  }

  function addProduct(p: RunnerProduct) {
    if (p.waterMl) {
      setLocalWater(p.waterMl)
    } else {
      setLocalItems(prev => {
        const idx = prev.findIndex(i => i.label === p.label)
        if (idx >= 0) return prev.map((item, j) => j === idx ? { ...item, qty: item.qty + 1 } : item)
        return [...prev, { qty: 1, label: p.label }]
      })
    }
    setProductMenuOpen(false)
    setProductSearch('')
  }

  function openProductMenu(e: React.MouseEvent) {
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

  const smallBtn = (onClick: (e: React.MouseEvent) => void, children: React.ReactNode) => (
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
        <ColorTag
          color="teal"
          icon={<Droplets className="size-3" strokeWidth={2} />}
          label={`${localWater} mL`}
          right={editing ? (
            <button type="button" onClick={e => { e.stopPropagation(); setLocalWater(undefined) }} className="-mr-50 ml-25 flex items-center hover:opacity-60">
              <X className="size-[9px]" strokeWidth={2.5} />
            </button>
          ) : undefined}
        />
      )}
      {localItems.map((item, j) => (
        <ColorTag
          key={j}
          color="lime"
          label={`${item.qty}× ${item.label}`}
          right={editing ? (
            <button type="button" onClick={e => { e.stopPropagation(); setLocalItems(prev => prev.filter((_, k) => k !== j)) }} className="-mr-50 ml-25 flex items-center hover:opacity-60">
              <X className="size-[9px]" strokeWidth={2.5} />
            </button>
          ) : undefined}
        />
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
    <div className="widget-card overflow-hidden">
      <div className="flex">
        <div className="w-[5px] shrink-0" style={{ backgroundColor: leftBorderColor }} />
        <div className="min-w-0 flex-1">

      {/* En-tête cliquable */}
      <div
        className="flex cursor-pointer items-start gap-150 px-200 pb-150 pt-200"
        onClick={() => setExpanded(v => !v)}
      >
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
        <ChevronDown
          className={`mt-25 size-4 shrink-0 text-neutral-300 transition-transform duration-200${expanded ? ' rotate-180' : ''}`}
          strokeWidth={2}
        />
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
                <ColorTag color="neutral"     icon={<Clock className="size-3" strokeWidth={2} />} label={fmtTime(localTimeMins)} />
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

        {/* Profil altimétrique (déplié) */}
        {expanded && segAltData.length >= 2 && (
          <div className="mt-200">
            <div className="mb-200 h-px bg-neutral-40" />
            <SlopeAltimetryChart data={segAltData} height={100} distanceStep={distStep} showLegend={false} />
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

// ── Petit switch on/off ─────────────────────────────────────────────────────────
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onMouseDown={e => e.preventDefault()}
      onClick={onChange}
      className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-neutral-60'}`}
    >
      <span
        className={`absolute top-1/2 size-[14px] -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[16px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

// ── Séparateur inter-segment ───────────────────────────────────────────────────
function SegmentSeparator({
  km, isRavito, onToggleRavito, globalEdit,
}: {
  km: number
  isRavito: boolean
  onToggleRavito: () => void
  globalEdit: boolean
}) {
  const [editingRow, setEditingRow] = useState(false)
  const [localKm, setLocalKm] = useState(km)

  const isEditing = editingRow || globalEdit

  return (
    <div className="flex flex-col gap-50 py-50">
      {/* Ligne principale — km / point / ravitaillement / stylo, toujours alignés sur une seule ligne */}
      <div className="flex items-center gap-75">
        <div className="flex flex-1 items-center justify-end gap-75">
          {isEditing ? (
            <>
              <div className="flex shrink-0 items-center gap-50 rounded-full border border-neutral-40 bg-white py-50 pl-150 pr-100">
                <Droplets className="size-3 text-neutral-400" strokeWidth={2} />
                <Switch checked={isRavito} onChange={onToggleRavito} />
              </div>
              <input
                autoFocus={editingRow}
                type="number"
                value={localKm}
                onChange={e => setLocalKm(+e.target.value)}
                className="input h-[26px] w-800 shrink-0 rounded-full px-100 py-0 text-center text-[12px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </>
          ) : (
            <ColorTag color="primary" label={`${localKm} km`} />
          )}
        </div>

        {/* Point central noir — sur le rail */}
        <span className="z-10 size-[10px] shrink-0 rounded-full bg-neutral-800" />

        <div className="flex flex-1 items-center justify-start gap-75">
          {!isEditing && isRavito && (
            <ColorTag color="pink" icon={<Droplets className="size-3" strokeWidth={2} />} label="Ravitaillement" />
          )}
          {!globalEdit && (
            <button
              type="button"
              onClick={() => setEditingRow(v => !v)}
              className="ml-auto flex size-300 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-neutral-40 hover:text-neutral-600"
            >
              {editingRow
                ? <Check  className="size-[13px]" strokeWidth={2.5} />
                : <Pencil className="size-[13px]" strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
