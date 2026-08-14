import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import TooltipRow from './TooltipRow'
import { useIsMobile } from '../hooks/useIsMobile'

export interface AltimetryPoint {
  km: number
  alt: number
}

interface AltimetryChartProps {
  data: AltimetryPoint[]
  height?: number
  /** km positions des séparations de segments (traits neutres continus 1px) */
  segments?: number[]
  /** km positions des ravitaillements (trait secondary 2px + rond numéroté en haut) */
  ravitoKms?: number[]
}

function AltimetryTooltip({ active, payload, cumulativeGain }: {
  active?: boolean
  payload?: { payload: AltimetryPoint }[]
  cumulativeGain: Map<number, number>
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-neutral-20 bg-white/95 px-150 py-100 text-[10px] shadow-lg backdrop-blur-sm">
      <p className="text-[11px] font-bold text-neutral-800">{point.km.toFixed(1)} km</p>
      <div className="mt-50 flex flex-col gap-25">
        <TooltipRow label="Altitude" value={`${Math.round(point.alt)} m`} />
        <TooltipRow label="D+ cumulé" value={`${cumulativeGain.get(point.km) ?? 0} m`} />
      </div>
    </div>
  )
}

/**
 * AltimetryChart — graphique de profil altimétrique.
 * Basé sur recharts AreaChart.
 *
 * Usage :
 *   const data: AltimetryPoint[] = [{ km: 0, alt: 200 }, { km: 20, alt: 2400 }, ...]
 *   <AltimetryChart data={data} height={130} segments={[12, 28, 45]} ravitoKms={[14.7, 29.9]} />
 *
 * - Courbe en primary-500, gradient de remplissage semi-transparent
 * - Légende de distance espacée tous les 10/20 km selon la distance totale (pas un marqueur par point)
 * - Séparateurs de segments en traits neutres continus 1px
 * - Marqueurs de ravitaillement en traits secondary continus 2px, avec un rond secondary numéroté en haut
 * - Tooltip au survol : km en gras, altitude, D+ cumulé — même style que les autres tooltips de profil
 */
export default function AltimetryChart({ data, height = 130, segments = [], ravitoKms = [] }: AltimetryChartProps) {
  const isMobile = useIsMobile()
  const sortedRavitoKms = useMemo(() => [...ravitoKms].sort((a, b) => a - b), [ravitoKms])
  const maxKm = data[data.length - 1]?.km ?? 0
  const kmStep = maxKm > 50 ? 20 : 10
  const xTicks = useMemo(() => {
    const ticks: number[] = []
    for (let k = 0; k <= maxKm + 1e-6; k += kmStep) ticks.push(+k.toFixed(1))
    return ticks
  }, [maxKm, kmStep])

  const cumulativeGain = useMemo(() => {
    let gain = 0
    const map = new Map<number, number>()
    data.forEach((p, i) => {
      if (i > 0) {
        const diff = p.alt - data[i - 1].alt
        if (diff > 0) gain += diff
      }
      map.set(p.km, Math.round(gain))
    })
    return map
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 26, right: 8, left: isMobile ? 0 : 4, bottom: 0 }}>
        <defs>
          <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-primary-500)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-20)" vertical={false} />
        <XAxis
          dataKey="km"
          type="number"
          domain={[0, 'dataMax']}
          ticks={xTicks}
          tick={({ x, y, payload }: { x?: string | number; y?: string | number; payload?: { value?: number } }) => {
            const v = payload?.value ?? 0
            const anchor = v === xTicks[0] ? 'start' : v === xTicks[xTicks.length - 1] ? 'end' : 'middle'
            return (
              <text x={x} y={Number(y ?? 0) + 12} textAnchor={anchor} fontSize={9} fill="var(--color-neutral-80)" fontFamily="Outfit, sans-serif">
                {v}km
              </text>
            )
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          hide={isMobile}
          tickFormatter={(v) => `${v}m`}
          tick={{ fontSize: 9, fill: 'var(--color-neutral-80)', fontFamily: 'Outfit, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={isMobile ? 0 : 46}
        />
        <Tooltip content={<AltimetryTooltip cumulativeGain={cumulativeGain} />} />
        {segments.map(km => (
          <ReferenceLine
            key={`seg-${km}`}
            x={km}
            stroke="var(--color-neutral-40)"
            strokeWidth={1}
          />
        ))}
        {sortedRavitoKms.map((km, i) => (
          <ReferenceLine
            key={`ravito-${km}`}
            x={km}
            stroke="var(--color-secondary-500)"
            strokeWidth={2}
            label={({ viewBox }: { viewBox?: { x?: number; y?: number } }) => (
              <g>
                <circle cx={viewBox?.x} cy={(viewBox?.y ?? 0) - 8} r={8} fill="var(--color-secondary-500)" stroke="#fff" strokeWidth={1.5} />
                <text
                  x={viewBox?.x}
                  y={(viewBox?.y ?? 0) - 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={700}
                  fill="#fff"
                >
                  {i + 1}
                </text>
              </g>
            )}
          />
        ))}
        <Area
          type="monotone"
          dataKey="alt"
          stroke="var(--color-primary-500)"
          strokeWidth={2.5}
          fill="url(#altGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--color-primary-500)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
