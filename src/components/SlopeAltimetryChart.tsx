import { useState } from 'react'
import type { AltimetryPoint } from './AltimetryChart'

const SLOPE_BANDS = [
  { max: 5,        color: '#6AAF7E', label: '<5%'    },
  { max: 10,       color: '#EEC040', label: '5–10%'  },
  { max: 15,       color: '#F08030', label: '10–15%' },
  { max: 20,       color: '#D03030', label: '15–20%' },
  { max: Infinity, color: '#7A1010', label: '>20%'   },
]

function getSlopeColor(slopePct: number) {
  const abs = Math.abs(slopePct)
  return SLOPE_BANDS.find(b => abs < b.max)?.color ?? '#7A1010'
}

interface Props {
  data: AltimetryPoint[]
  height?: number
  segments?: number[]
  distanceStep?: number
  showLegend?: boolean
}

export default function SlopeAltimetryChart({
  data,
  height = 200,
  segments = [],
  distanceStep = 20,
  showLegend = true,
}: Props) {
  const [tooltip, setTooltip] = useState<{ km: number; alt: number; px: number } | null>(null)

  const VW = 800
  const MT = 8, MB = 28, ML = 50, MR = 8
  const chartH = height - MT - MB
  const chartW = VW - ML - MR

  const minAlt = Math.min(...data.map(d => d.alt))
  const maxAlt = Math.max(...data.map(d => d.alt))
  const altRange = maxAlt - minAlt || 1
  const maxKm = data[data.length - 1].km

  const toX = (km: number) => ML + (km / maxKm) * chartW
  const toY = (alt: number) => MT + (1 - (alt - minAlt) / altRange) * chartH
  const baseY = MT + chartH

  // Interpolate at fine intervals for slope color bands
  const STEP = 0.5
  const pts: AltimetryPoint[] = []
  for (let km = 0; km < maxKm; km += STEP) {
    let idx = 0
    while (idx < data.length - 2 && data[idx + 1].km <= km) idx++
    const p0 = data[idx]
    const p1 = data[Math.min(idx + 1, data.length - 1)]
    const t = p0.km === p1.km ? 0 : Math.max(0, Math.min(1, (km - p0.km) / (p1.km - p0.km)))
    pts.push({ km, alt: p0.alt + t * (p1.alt - p0.alt) })
  }
  pts.push({ km: maxKm, alt: data[data.length - 1].alt })

  // Altitude grid lines
  const rawStep = Math.ceil(altRange / 3 / 100) * 100
  const altTicks: number[] = []
  for (let a = Math.ceil((minAlt + 50) / rawStep) * rawStep; a < maxAlt - 50; a += rawStep) {
    altTicks.push(a)
  }

  // Distance tick marks
  const distTicks: number[] = []
  for (let km = 0; km <= maxKm; km += distanceStep) {
    distTicks.push(km)
  }
  if (distTicks[distTicks.length - 1] !== maxKm) distTicks.push(maxKm)

  // SVG terrain path (using original data points for smooth curve)
  const terrainPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.km).toFixed(1)},${toY(p.alt).toFixed(1)}`)
    .join(' ')

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const svgX = relX * VW
    const km = Math.max(0, Math.min(maxKm, (svgX - ML) / chartW * maxKm))

    let idx = 0
    while (idx < data.length - 2 && data[idx + 1].km <= km) idx++
    const p0 = data[idx], p1 = data[Math.min(idx + 1, data.length - 1)]
    const t = p0.km === p1.km ? 0 : (km - p0.km) / (p1.km - p0.km)
    const alt = Math.round(p0.alt + t * (p1.alt - p0.alt))
    setTooltip({ km: Math.round(km * 10) / 10, alt, px: svgX })
  }

  return (
    <div>
      <div className="relative select-none">
        <svg
          viewBox={`0 0 ${VW} ${height}`}
          className="w-full"
          style={{ height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Altitude grid lines */}
          {altTicks.map(a => (
            <g key={a}>
              <line
                x1={ML} y1={toY(a)} x2={VW - MR} y2={toY(a)}
                stroke="var(--color-neutral-20)" strokeDasharray="2,3" strokeWidth={0.5}
              />
              <text
                x={ML - 4} y={toY(a)}
                textAnchor="end" dominantBaseline="middle"
                fontSize={8} fill="var(--color-neutral-80)"
              >{a}m</text>
            </g>
          ))}

          {/* Slope-colored fill trapezoids */}
          {pts.slice(0, -1).map((p0, i) => {
            const p1 = pts[i + 1]
            const dKm = p1.km - p0.km
            const slope = dKm > 0 ? (p1.alt - p0.alt) / (dKm * 1000) * 100 : 0
            return (
              <polygon
                key={i}
                points={`${toX(p0.km).toFixed(1)},${baseY} ${toX(p0.km).toFixed(1)},${toY(p0.alt).toFixed(1)} ${toX(p1.km).toFixed(1)},${toY(p1.alt).toFixed(1)} ${toX(p1.km).toFixed(1)},${baseY}`}
                fill={getSlopeColor(slope)}
              />
            )
          })}

          {/* Terrain outline */}
          <path
            d={terrainPath}
            fill="none"
            stroke="#111"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Segment separators */}
          {segments.map(km => (
            <line
              key={km}
              x1={toX(km)} y1={MT} x2={toX(km)} y2={baseY}
              stroke="var(--color-secondary-500)"
              strokeDasharray="4,3"
              strokeWidth={1}
              opacity={0.55}
            />
          ))}

          {/* Tooltip vertical line */}
          {tooltip && (
            <line
              x1={tooltip.px} y1={MT} x2={tooltip.px} y2={baseY}
              stroke="var(--color-primary-500)"
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.6}
            />
          )}

          {/* X axis baseline */}
          <line
            x1={ML} y1={baseY} x2={VW - MR} y2={baseY}
            stroke="var(--color-neutral-30)"
            strokeWidth={0.5}
          />

          {/* Distance tick marks + labels */}
          {distTicks.map(km => (
            <g key={km}>
              <line
                x1={toX(km)} y1={baseY} x2={toX(km)} y2={baseY + 3}
                stroke="var(--color-neutral-80)" strokeWidth={0.5}
              />
              <text
                x={toX(km)}
                y={baseY + 13}
                textAnchor={km === maxKm ? 'end' : 'middle'}
                fontSize={8}
                fill="var(--color-neutral-500)"
              >
                {km === 0 ? '0' : km === maxKm ? `${km} km` : `${km}`}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip card */}
        {tooltip && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-neutral-20 bg-white px-150 py-100 text-center shadow-sm"
            style={{
              left: `${Math.min(Math.max(tooltip.px / VW * 100, 8), 78)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-[10px] text-neutral-400">{tooltip.km} km</p>
            <p className="text-[13px] font-bold text-primary-600">{tooltip.alt.toLocaleString('fr')} m</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && <div className="mt-150 flex flex-wrap items-center justify-center gap-x-200 gap-y-75">
        <span className="eyebrow text-[9px] uppercase tracking-wider text-neutral-80">Pente</span>
        {SLOPE_BANDS.map(b => (
          <span key={b.label} className="flex items-center gap-50 text-[10px] text-neutral-500">
            <span className="inline-block size-100 shrink-0 rounded-sm" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>}
    </div>
  )
}
