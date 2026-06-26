import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

export interface AltimetryPoint {
  km: number
  alt: number
}

interface AltimetryChartProps {
  data: AltimetryPoint[]
  height?: number
  /** km positions des séparations de segments (traits verticaux pointillés) */
  segments?: number[]
}

/**
 * AltimetryChart — graphique de profil altimétrique.
 * Basé sur recharts AreaChart.
 *
 * Usage :
 *   const data: AltimetryPoint[] = [{ km: 0, alt: 200 }, { km: 20, alt: 2400 }, ...]
 *   <AltimetryChart data={data} height={130} segments={[12, 28, 45, ...]} />
 *
 * - Courbe en accent-500 (orange)
 * - Gradient de remplissage semi-transparent
 * - Séparateurs de segments en pointillés neutres
 * - Tooltip au hover avec altitude en mètres
 */
export default function AltimetryChart({ data, height = 130, segments = [] }: AltimetryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-primary-500)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-20)" vertical={false} />
        <XAxis
          dataKey="km"
          tickFormatter={(v) => `${v}km`}
          tick={{ fontSize: 9, fill: 'var(--color-neutral-80)', fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `${v}m`}
          tick={{ fontSize: 9, fill: 'var(--color-neutral-80)', fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid var(--color-neutral-20)',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'Manrope, sans-serif',
          }}
          formatter={(value: number) => [`${value} m`, 'Altitude']}
          labelFormatter={(label) => `${label} km`}
        />
        {segments.map((km) => (
          <ReferenceLine
            key={km}
            x={km}
            stroke="var(--color-accent-500)"
            strokeDasharray="3 3"
            strokeWidth={1}
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
