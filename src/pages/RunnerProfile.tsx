import { useState } from 'react'
import {
  Mountain, Edit2, GripVertical, Droplets,
  Plus, Minus, Check, X, Timer, Trophy, TrendingUp,
  Zap, Calendar, Clock, Flame, ChevronDown,
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

// ── Radar chart ──────────────────────────────────────────────────────────────

const radarAxes = [
  { label: ['Grimpeur', '/ Descendeur'],    value: 78 },
  { label: ['Plat-roulant', '/ Technique'], value: 62 },
  { label: ['Régularité', 'du pacing'],     value: 72 },
  { label: ['Tolérance', 'à la durée'],     value: 85 },
  { label: ['Profil de', 'distance'],       value: 68 },
  { label: ['Expérience'],                  value: 58 },
]

function RadarChart({ data }: { data: { label: string[]; value: number }[] }) {
  const cx = 160, cy = 165, r = 85, lr = 110, levels = 4
  const n = data.length
  const ang = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2
  const pt = (i: number, mag: number) => ({
    x: cx + mag * Math.cos(ang(i)),
    y: cy + mag * Math.sin(ang(i)),
  })
  const gridPolys = Array.from({ length: levels }, (_, l) =>
    data.map((_, i) => pt(i, r * (l + 1) / levels))
      .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  )
  const dataPoly = data
    .map((d, i) => pt(i, r * d.value / 100))
    .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineH = 12.5
  return (
    <svg viewBox="0 0 320 318" className="w-full overflow-visible">
      {data.map((_, i) => {
        const p = pt(i, r)
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e3e1de" strokeWidth="1" />
      })}
      {gridPolys.map((pts, l) => (
        <polygon key={l} points={pts} fill="none"
          stroke={l === levels - 1 ? '#cbc8c3' : '#e3e1de'}
          strokeWidth={l === levels - 1 ? 1.5 : 1} />
      ))}
      <polygon points={dataPoly} fill="rgba(43,161,171,0.13)" stroke="#18747c" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const p = pt(i, r * d.value / 100)
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#18747c" />
      })}
      {data.map((d, i) => {
        const p = pt(i, lr)
        const anchor = p.x < cx - 8 ? 'end' : p.x > cx + 8 ? 'start' : 'middle'
        const totalH = (d.label.length - 1) * lineH
        const startY = p.y - totalH / 2
        return (
          <text key={i} textAnchor={anchor} fontSize="11"
            fill="#39342d" fontFamily="Manrope, sans-serif" fontWeight="600">
            {d.label.map((line, li) => (
              <tspan key={li} x={p.x.toFixed(1)} y={(startY + li * lineH).toFixed(1)} dominantBaseline="middle">
                {line}
              </tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────

const yearStats = [
  { label: 'Km parcourus',      value: '342',   unit: 'km',     icon: TrendingUp },
  { label: 'Dénivelé positif',  value: '8 200', unit: 'm',      icon: Mountain   },
  { label: 'Courses réalisées', value: '3',     unit: '',       icon: Trophy     },
  { label: 'Volume hebdo',      value: '42',    unit: 'km/sem', icon: Calendar   },
]

const longestRun = { name: 'Grand Raid Belledonne', distance: '28 km', time: '3h12' }

const initChronos = [
  { label: '1 km',          time: '4:12'  },
  { label: '5 km',          time: '22:45' },
  { label: '10 km',         time: '48:30' },
  { label: 'Semi-marathon', time: '1h48'  },
  { label: '30 km',         time: '2h55'  },
  { label: 'Marathon',      time: '3h52'  },
]

type Product = { name: string; glucides: number; ratio: string }

const initProducts: Product[] = [
  { name: 'Maurten Gel 100',             glucides: 25, ratio: '1:0.8' },
  { name: 'Spring Energy Awesome Sauce', glucides: 45, ratio: '2:1'   },
  { name: 'Tailwind Endurance Fuel',     glucides: 50, ratio: '2:1'   },
  { name: 'Clémentines fraîches',        glucides: 12, ratio: '1:1'   },
]

type PenteRow = { label: string; roulant: string; technique: string }
type Aptitude = {
  type: string
  vitesse: string
  kmEffort: string
  montee: PenteRow[]
  descente: PenteRow[]
}

const initAptitudes: Aptitude[] = [
  {
    type: 'Courte  (< 25 km)', vitesse: '7:04', kmEffort: '15',
    montee: [
      { label: '5 – 10 %',  roulant: '8:30',  technique: '10:00' },
      { label: '10 – 15 %', roulant: '10:00', technique: '12:30' },
      { label: '15 – 20 %', roulant: '12:00', technique: '15:00' },
      { label: '> 20 %',    roulant: '15:00', technique: '17:00' },
    ],
    descente: [
      { label: '5 – 10 %',  roulant: '5:30', technique: '6:30' },
      { label: '10 – 15 %', roulant: '6:30', technique: '7:30' },
      { label: '> 15 %',    roulant: '7:30', technique: '9:00' },
    ],
  },
  {
    type: 'Longue  (25 – 60 km)', vitesse: '8:20', kmEffort: '10',
    montee: [
      { label: '5 – 10 %',  roulant: '9:30',  technique: '11:30' },
      { label: '10 – 15 %', roulant: '11:30', technique: '14:00' },
      { label: '15 – 20 %', roulant: '13:30', technique: '16:30' },
      { label: '> 20 %',    roulant: '17:00', technique: '19:00' },
    ],
    descente: [
      { label: '5 – 10 %',  roulant: '6:00', technique: '7:00' },
      { label: '10 – 15 %', roulant: '7:00', technique: '8:00' },
      { label: '> 15 %',    roulant: '8:00', technique: '9:30' },
    ],
  },
  {
    type: 'Ultra   (> 60 km)', vitesse: '9:50', kmEffort: '6',
    montee: [
      { label: '5 – 10 %',  roulant: '11:00', technique: '13:00' },
      { label: '10 – 15 %', roulant: '13:00', technique: '15:30' },
      { label: '15 – 20 %', roulant: '15:00', technique: '18:00' },
      { label: '> 20 %',    roulant: '19:00', technique: '21:00' },
    ],
    descente: [
      { label: '5 – 10 %',  roulant: '6:30', technique: '7:30'  },
      { label: '10 – 15 %', roulant: '7:30', technique: '9:00'  },
      { label: '> 15 %',    roulant: '9:00', technique: '11:00' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function PaceCell({ value, editing, onChange }: {
  value: string
  editing: boolean
  onChange: (v: string) => void
}) {
  const isMarche = value === 'marche'
  if (editing) return (
    <input
      className="w-14 rounded-md border border-neutral-30 bg-neutral-0 px-50 py-25 text-center text-xs font-bold text-neutral-700 outline-none focus:border-primary-400"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
  return (
    <span className={`text-xs font-bold ${isMarche ? 'italic text-neutral-400' : 'text-neutral-700'}`}>
      {value}{!isMarche && <span className="ml-25 text-[9px] font-medium text-neutral-400">/km</span>}
    </span>
  )
}

function PenteTable({
  label, icon, rows, editing, variant, onEdit,
}: {
  label: string
  icon: React.ReactNode
  rows: PenteRow[]
  editing: boolean
  variant: 'montee' | 'descente'
  onEdit: (k: number, key: 'roulant' | 'technique', val: string) => void
}) {
  const isMontee = variant === 'montee'
  const borderCls  = isMontee ? 'border-primary-200'  : 'border-neutral-30'
  const headerBg   = isMontee ? 'bg-primary-100'      : 'bg-neutral-20'
  const headerText = isMontee ? 'text-primary-800'    : 'text-neutral-600'
  const colsBg     = isMontee ? 'bg-primary-50'       : 'bg-neutral-10'
  const colsText   = isMontee ? 'text-primary-600'    : 'text-neutral-500'
  const rowBorder  = 'border-neutral-20'

  return (
    <div className={`overflow-hidden rounded-xl border ${borderCls}`}>
      {/* Header */}
      <div className={`flex items-center gap-100 px-150 py-100 ${headerBg}`}>
        <span className={headerText}>{icon}</span>
        <p className={`text-[10px] eyebrow ${headerText}`}>{label}</p>
      </div>
      {/* Column labels */}
      <div className={`grid grid-cols-[1fr_auto_auto] gap-x-150 border-b px-150 py-75 ${colsBg} ${rowBorder}`}>
        <span />
        <p className={`w-14 text-center text-[9px] eyebrow ${colsText}`}>Roulant</p>
        <p className="w-14 text-center text-[9px] eyebrow text-neutral-400">Technique</p>
      </div>
      {/* Rows */}
      {rows.map((row, k) => (
        <div key={k} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-150 px-150 py-100 [&:not(:last-child)]:border-b [&:not(:last-child)]:${rowBorder}`}>
          <span className="text-[10px] font-semibold text-neutral-500">{row.label}</span>
          <div className={`flex w-14 justify-center ${isMontee ? 'text-primary-700' : 'text-neutral-700'}`}>
            <PaceCell value={row.roulant}   editing={editing} onChange={v => onEdit(k, 'roulant', v)}   />
          </div>
          <div className="flex w-14 justify-center text-neutral-400">
            <PaceCell value={row.technique} editing={editing} onChange={v => onEdit(k, 'technique', v)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RunnerProfile() {
  const [chronos, setChronos]             = useState(initChronos)
  const [editChronos, setEditChronos]     = useState(false)
  const [products, setProducts]           = useState(initProducts)
  const [waterPerHour, setWaterPerHour]   = useState(650)
  const [aptitudes, setAptitudes]         = useState(initAptitudes)
  const [editAptitudes, setEditAptitudes] = useState(false)
  const [expandedApt, setExpandedApt]     = useState<number | null>(null)

  const toggleApt = (i: number) => setExpandedApt(prev => prev === i ? null : i)

  const editMontee = (i: number, k: number, key: 'roulant' | 'technique', val: string) =>
    setAptitudes(ap => ap.map((x, j) => j !== i ? x : {
      ...x, montee: x.montee.map((m, l) => l === k ? { ...m, [key]: val } : m)
    }))

  const editDescente = (i: number, k: number, key: 'roulant' | 'technique', val: string) =>
    setAptitudes(ap => ap.map((x, j) => j !== i ? x : {
      ...x, descente: x.descente.map((d, l) => l === k ? { ...d, [key]: val } : d)
    }))

  return (
    <AppLayout activeItem="profil" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <p className="text-[11px] eyebrow text-neutral-90">
            Mon profil
          </p>
          <div className="mt-200 flex items-center gap-300">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-500 text-2xl font-bold text-neutral-0">
              RB
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-800">Romane Beaujean</h1>
              <p className="mt-25 text-sm text-neutral-80">Traileur · Niveau intermédiaire</p>
            </div>
          </div>
        </section>

        {/* ── Aptitudes trail ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <div className="flex items-center gap-150">
              <Zap className="size-4 text-primary-400 shrink-0" strokeWidth={2} />
              <p className="widget-title">Aptitudes trail</p>
            </div>
            <button
              onClick={() => setEditAptitudes(v => !v)}
              className="flex items-center gap-75 rounded-lg px-150 py-75 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-20"
            >
              {editAptitudes
                ? <><Check className="size-3.5" strokeWidth={2.5} />Enregistrer</>
                : <><Edit2 className="size-3.5" strokeWidth={2} />Modifier</>}
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-200 px-200 pb-75">
            <p className="text-[10px] eyebrow text-neutral-400">Type</p>
            <p className="text-center text-[10px] eyebrow text-neutral-400">Allure moy.</p>
            <p className="text-center text-[10px] eyebrow text-neutral-400">Km-effort</p>
            <span />
          </div>

          {aptitudes.map((a, i) => {
            const expanded = expandedApt === i
            return (
              <div key={i}>
                {/* Summary row */}
                <button
                  onClick={() => toggleApt(i)}
                  className="widget-row grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-x-200 px-200 py-150 text-left"
                >
                  <p className="text-xs font-semibold text-neutral-700">{a.type}</p>
                  {editAptitudes ? (
                    <>
                      <div className="flex items-center gap-50" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-14 rounded-lg border border-neutral-30 bg-neutral-10 px-100 py-50 text-center text-sm font-bold text-primary-700 outline-none focus:border-primary-400"
                          value={a.vitesse}
                          onChange={e => setAptitudes(ap => ap.map((x, j) => j === i ? { ...x, vitesse: e.target.value } : x))}
                        />
                        <span className="text-[10px] text-neutral-400">/km</span>
                      </div>
                      <div className="flex items-center gap-50" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-12 rounded-lg border border-neutral-30 bg-neutral-10 px-100 py-50 text-center text-sm font-bold text-primary-700 outline-none focus:border-primary-400"
                          value={a.kmEffort}
                          onChange={e => setAptitudes(ap => ap.map((x, j) => j === i ? { ...x, kmEffort: e.target.value } : x))}
                        />
                        <span className="text-[10px] text-neutral-400">KE</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-center text-sm font-bold text-primary-700">
                        {a.vitesse}<span className="ml-25 text-[10px] font-medium text-neutral-400">/km</span>
                      </p>
                      <p className="text-center text-sm font-bold text-primary-400">
                        {a.kmEffort}<span className="ml-25 text-[10px] font-medium text-neutral-400">KE</span>
                      </p>
                    </>
                  )}
                  <ChevronDown
                    className={`size-4 shrink-0 text-neutral-40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-neutral-20 bg-neutral-10/50 px-200 py-200">
                    <div className="grid grid-cols-1 gap-150 sm:grid-cols-2">
                      <PenteTable
                        label="Montée"
                        variant="montee"
                        icon={<TrendingUp className="size-3 shrink-0" strokeWidth={2} />}
                        rows={a.montee}
                        editing={editAptitudes}
                        onEdit={(k, key, val) => editMontee(i, k, key, val)}
                      />
                      <PenteTable
                        label="Descente"
                        variant="descente"
                        icon={<TrendingUp className="size-3 shrink-0 rotate-180" strokeWidth={2} />}
                        rows={a.descente}
                        editing={editAptitudes}
                        onEdit={(k, key, val) => editDescente(i, k, key, val)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>

        {/* ── Cette année + Profil athlétique ── */}
        <section className="grid grid-cols-1 gap-200 lg:grid-cols-5">

          {/* Left — Cette année */}
          <div className="flex flex-col gap-150 lg:col-span-3">
            <p className="widget-title">Cette année</p>
            <div className="grid grid-cols-2 gap-150">
              {yearStats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="widget-card flex flex-col justify-between p-300">
                    <div className="flex items-center gap-75">
                      <Icon className="size-3 text-neutral-90 shrink-0" strokeWidth={2} />
                      <p className="widget-label">{s.label}</p>
                    </div>
                    <p className="mt-200 text-3xl font-extrabold text-primary-700">
                      {s.value}
                      {s.unit && <span className="ml-50 text-sm font-medium text-neutral-400">{s.unit}</span>}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Course la plus longue */}
            <div className="widget-card p-300">
              <div className="flex items-center gap-75 mb-150">
                <Clock className="size-3 text-neutral-90 shrink-0" strokeWidth={2} />
                <p className="widget-label">Course la plus longue</p>
              </div>
              <p className="text-sm font-bold text-neutral-700">{longestRun.name}</p>
              <div className="mt-150 flex items-center gap-300">
                <div>
                  <p className="text-3xl font-extrabold text-primary-700">{longestRun.distance}</p>
                  <p className="mt-25 text-[10px] text-neutral-400">distance</p>
                </div>
                <div className="h-10 w-px bg-neutral-30" />
                <div>
                  <p className="text-3xl font-extrabold text-primary-700">{longestRun.time}</p>
                  <p className="mt-25 text-[10px] text-neutral-400">durée</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Profil athlétique */}
          <div className="widget-card flex flex-col p-300 lg:col-span-2">
            <p className="widget-title mb-100">Profil athlétique</p>
            <div className="flex flex-1 items-center">
              <RadarChart data={radarAxes} />
            </div>
          </div>

        </section>

        {/* ── Références chronométriques ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <div className="flex items-center gap-150">
              <Timer className="size-4 text-primary-400 shrink-0" strokeWidth={2} />
              <p className="widget-title">Références chronométriques</p>
            </div>
            <button
              onClick={() => setEditChronos(v => !v)}
              className="flex items-center gap-75 rounded-lg px-150 py-75 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-20"
            >
              {editChronos
                ? <><Check className="size-3.5" strokeWidth={2.5} />Enregistrer</>
                : <><Edit2 className="size-3.5" strokeWidth={2} />Modifier</>}
            </button>
          </div>
          {chronos.map((c, i) => (
            <div key={i} className="widget-row flex items-center justify-between px-200 py-150">
              <p className="text-sm font-bold text-neutral-800">{c.label}</p>
              {editChronos ? (
                <input
                  className="w-24 rounded-lg border border-neutral-30 bg-neutral-10 px-150 py-75 text-right text-sm font-bold text-primary-700 outline-none focus:border-primary-400"
                  value={c.time}
                  onChange={e => setChronos(ch => ch.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
                />
              ) : (
                <p className="text-base font-bold text-primary-700">{c.time}</p>
              )}
            </div>
          ))}
        </section>

        {/* ── Mes produits nutrition ── */}
        <section className="widget-card overflow-hidden p-100">
          <div className="flex items-center justify-between px-200 py-150">
            <div className="flex items-center gap-150">
              <Flame className="size-4 text-primary-400 shrink-0" strokeWidth={2} />
              <p className="widget-title">Mes produits nutrition</p>
            </div>
            <span className="text-[10px] eyebrow text-neutral-400">
              Par préférence
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-150 px-200 pb-75">
            <span /><span />
            <p className="w-14 text-center text-[10px] eyebrow text-neutral-400">Glucides</p>
            <p className="w-12 text-center text-[10px] eyebrow text-neutral-400">Glu:Fru</p>
            <span />
          </div>

          {products.map((p, i) => (
            <div key={i} className="widget-row grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-150 px-200 py-150">
              <GripVertical className="size-4 shrink-0 cursor-grab text-neutral-40" strokeWidth={2} />
              <div className="flex items-center gap-100">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-neutral-800">{p.name}</p>
              </div>
              <p className="w-14 text-center text-sm font-bold text-primary-700">
                {p.glucides}<span className="ml-25 text-[10px] font-medium text-neutral-400">g</span>
              </p>
              <p className="w-12 text-center text-xs font-semibold text-neutral-600">{p.ratio}</p>
              <button
                onClick={() => setProducts(pr => pr.filter((_, j) => j !== i))}
                className="rounded-lg p-75 text-neutral-40 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}

          <div className="border-t border-neutral-20 px-200 py-150">
            <button className="flex items-center gap-100 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700">
              <Plus className="size-3.5" strokeWidth={2.5} />
              Ajouter un produit
            </button>
          </div>

          {/* Eau */}
          <div className="mx-200 mb-150 rounded-2xl bg-primary-50 p-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-150">
                <Droplets className="size-4 shrink-0 text-primary-500" strokeWidth={2} />
                <p className="widget-label">Eau moyenne / heure</p>
              </div>
              <div className="flex items-center gap-100">
                <button
                  onClick={() => setWaterPerHour(w => Math.max(100, w - 50))}
                  className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-colors hover:bg-primary-200"
                >
                  <Minus className="size-3" strokeWidth={2.5} />
                </button>
                <span className="w-20 text-center text-base font-bold text-primary-700">
                  {waterPerHour}
                  <span className="ml-25 text-xs font-medium text-neutral-400">ml</span>
                </span>
                <button
                  onClick={() => setWaterPerHour(w => w + 50)}
                  className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-colors hover:bg-primary-200"
                >
                  <Plus className="size-3" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  )
}
