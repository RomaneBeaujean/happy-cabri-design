import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TrackPoint } from '../pages/RacePlan/trackData'
import { latLngAtKm, nearestKmOnTrack } from '../utils/geo'
import type { ChartPoint } from './SlopeAltimetryChart'

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

type LayerKey = 'terrain' | 'satellite'

export interface MapSegment { from: number; to: number; isClimb: boolean }

interface Props {
  height?: number
  track: TrackPoint[]
  segments?: MapSegment[]
  points?: ChartPoint[]
  onAddPoint?: (km: number, clientX: number, clientY: number) => void
}

function sliceLatLngs(track: TrackPoint[], from: number, to: number): [number, number][] {
  const inner = track.filter(p => p.km > from && p.km < to).map((p): [number, number] => [p.lat, p.lon])
  return [latLngAtKm(track, from), ...inner, latLngAtKm(track, to)]
}

export default function RouteMap({ height = 320, track, segments = [], points = [], onAddPoint }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const onAddPointRef = useRef(onAddPoint)
  onAddPointRef.current = onAddPoint
  const [mode, setMode] = useState<LayerKey>('terrain')

  const route: [number, number][] = track.map(p => [p.lat, p.lon])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    const bounds = L.latLngBounds(route)
    map.fitBounds(bounds, { padding: [24, 24] })

    tileRef.current = L.tileLayer(TILES.terrain.url, {
      attribution: TILES.terrain.attribution,
      maxZoom: 18,
    }).addTo(map)

    layerGroupRef.current = L.layerGroup().addTo(map)

    map.on('click', e => {
      if (!onAddPointRef.current) return
      const km = nearestKmOnTrack(track, e.latlng.lat, e.latlng.lng)
      onAddPointRef.current(Math.round(km * 10) / 10, e.originalEvent.clientX, e.originalEvent.clientY)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      tileRef.current = null
      layerGroupRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch tile layer when mode changes
  useEffect(() => {
    if (!tileRef.current) return
    const cfg = TILES[mode]
    tileRef.current.setUrl(cfg.url)
    tileRef.current.options.attribution = cfg.attribution
  }, [mode])

  // Redraw route/segments/markers whenever the underlying data changes
  useEffect(() => {
    const map = mapRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return
    layerGroup.clearLayers()

    if (segments.length > 0) {
      for (const seg of segments) {
        L.polyline(sliceLatLngs(track, seg.from, seg.to), {
          color: seg.isClimb ? '#303030' : '#F3C94A',
          weight: 3.5,
          opacity: 0.95,
        }).addTo(layerGroup)
      }
    } else {
      L.polyline(route, { color: '#303030', weight: 3.5, opacity: 0.95 }).addTo(layerGroup)
    }

    for (const p of points) {
      const [lat, lon] = latLngAtKm(track, p.km)
      L.circleMarker([lat, lon], {
        radius: 6,
        fillColor: p.isRavito ? '#e5afcd' : '#8a9098',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(layerGroup)
    }

    // Start marker (green)
    L.circleMarker(route[0], {
      radius: 7, fillColor: '#22c55e', color: '#fff', fillOpacity: 1, weight: 2,
    }).addTo(layerGroup)

    // End marker (red)
    L.circleMarker(route[route.length - 1], {
      radius: 7, fillColor: '#ef4444', color: '#fff', fillOpacity: 1, weight: 2,
    }).addTo(layerGroup)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, segments, points])

  const MODES: { key: LayerKey; label: string }[] = [
    { key: 'terrain', label: 'Terrain' },
    { key: 'satellite', label: 'Satellite' },
  ]

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div ref={containerRef} className={`absolute inset-0${onAddPoint ? ' cursor-crosshair' : ''}`} />

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
