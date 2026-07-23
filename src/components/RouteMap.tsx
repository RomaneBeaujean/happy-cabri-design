import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TILES = {
  terrain: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
}

// Mock route — Grand Raid de La Réunion (Diagonale des Fous, simplified)
const ROUTE: [number, number][] = [
  [-21.3497, 55.7088], // Saint-Philippe (départ)
  [-21.3200, 55.6700],
  [-21.2900, 55.6300],
  [-21.2600, 55.6000],
  [-21.2200, 55.5700],
  [-21.1900, 55.5450],
  [-21.1600, 55.5200],
  [-21.1300, 55.5000],
  [-21.0850, 55.4750], // Cilaos
  [-21.0700, 55.4500],
  [-21.0600, 55.4200],
  [-21.0850, 55.3900], // Mafate
  [-21.0650, 55.3750],
  [-21.0400, 55.3850],
  [-21.0200, 55.4000],
  [-20.9900, 55.4100],
  [-20.9600, 55.4300],
  [-20.9300, 55.4450],
  [-20.9000, 55.4500],
  [-20.8831, 55.4504], // Saint-Denis (arrivée)
]

type LayerKey = 'terrain' | 'satellite'

interface Props {
  height?: number
}

export default function RouteMap({ height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const [mode, setMode] = useState<LayerKey>('terrain')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    // Fit to route bounds
    const bounds = L.latLngBounds(ROUTE)
    map.fitBounds(bounds, { padding: [24, 24] })

    // Tile layer
    tileRef.current = L.tileLayer(TILES.terrain.url, {
      attribution: TILES.terrain.attribution,
      maxZoom: 18,
    }).addTo(map)

    // Route polyline
    L.polyline(ROUTE, { color: '#22c55e', weight: 3, opacity: 0.9 }).addTo(map)

    // Start marker (green)
    L.circleMarker(ROUTE[0], {
      radius: 7, fillColor: '#22c55e', color: '#fff', fillOpacity: 1, weight: 2,
    }).addTo(map)

    // End marker (red)
    L.circleMarker(ROUTE[ROUTE.length - 1], {
      radius: 7, fillColor: '#ef4444', color: '#fff', fillOpacity: 1, weight: 2,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      tileRef.current = null
    }
  }, [])

  // Switch tile layer when mode changes
  useEffect(() => {
    if (!tileRef.current) return
    const cfg = TILES[mode]
    tileRef.current.setUrl(cfg.url)
    // Update attribution
    tileRef.current.options.attribution = cfg.attribution
  }, [mode])

  const MODES: { key: LayerKey; label: string }[] = [
    { key: 'terrain', label: 'Terrain' },
    { key: 'satellite', label: 'Satellite' },
  ]

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Layer toggle */}
      <div className="absolute right-[10px] top-[10px] z-[1000] flex overflow-hidden rounded-lg border border-neutral-20 bg-white shadow-widget">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={[
              'px-150 py-75 text-[11px] font-semibold transition-colors',
              mode === m.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-10',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
