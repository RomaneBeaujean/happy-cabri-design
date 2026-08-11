import { useEffect, useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TrackPoint } from '../pages/RacePlan/trackData'
import { haversineMeters, latLngAtKm, nearestKmOnTrack } from '../utils/geo'
import type { PointStats } from '../pages/RacePlan/trackStats'
import type { ChartPoint } from './SlopeAltimetryChart'
import { getSlopeColor, WAYPOINT_COLOR, RAVITO_COLOR } from '../pages/RacePlan/slopeColors'
import ColorTag from './ColorTag'
import TooltipRow from './TooltipRow'
import { useIsMobile } from '../hooks/useIsMobile'

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

export interface MapSegment { id: string; from: number; to: number; isClimb: boolean; label: string; dp: number; dm: number; pace: string }

interface Props {
  height?: number
  track: TrackPoint[]
  segments?: MapSegment[]
  points?: ChartPoint[]
  getStats?: (km: number) => PointStats
  onAddPoint?: (km: number, clientX: number, clientY: number) => void
  onPointClick?: (id: string, clientX: number, clientY: number) => void
  onPointMove?: (id: string, newKm: number) => void
  /** Km survolé, partagé avec le profil pour synchroniser les deux vues. */
  hoverKm?: number | null
  onHoverKmChange?: (km: number | null) => void
  /** Km du point en cours d'ajout (popup ouverte) — le point de survol reste affiché en secondary. */
  pendingKm?: number | null
  /** Id du point existant dont le menu est ouvert — affiché en secondary et agrandi. */
  activePointId?: string | null
  /** Id du point dont la tooltip est épinglée en mobile (lecture seule), partagé avec le profil
   * pour qu'un tap dans une vue ferme/synchronise la tooltip de l'autre. */
  pinnedPointId?: string | null
  onPinnedPointChange?: (id: string | null) => void
}

const CLICK_PROXIMITY_PX = 20
const HOVER_PROXIMITY_PX = 26
const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 6
const POINT_RADIUS = 6
const POINT_RADIUS_HOVER = 9
const POINT_RADIUS_ACTIVE = 10
const SECONDARY = '#F3C94A'
// Largeur maximale plausible de la tooltip custom (whitespace-nowrap) — utilisée pour décider si
// elle doit basculer à gauche du point plutôt que de déborder à droite du conteneur.
const TOOLTIP_WIDTH_ESTIMATE = 260

function slopeBetween(a: TrackPoint, b: TrackPoint): number {
  const distM = haversineMeters(a, b)
  return distM > 0 ? ((b.alt - a.alt) / distM) * 100 : 0
}

function slopeAtKmOnTrack(track: TrackPoint[], km: number): number {
  let idx = 0
  while (idx < track.length - 2 && track[idx + 1].km <= km) idx++
  const p0 = track[idx], p1 = track[Math.min(idx + 1, track.length - 1)]
  return slopeBetween(p0, p1)
}

/** Regroupe le tracé en tronçons de couleur constante selon la pente locale (mêmes bandes que
 * le profil), pour dessiner le trait de la carte comme les trapèzes colorés du graphique. */
function getSlopeColoredPolylines(track: TrackPoint[]): { color: string; latlngs: [number, number][] }[] {
  if (track.length < 2) return []
  const runs: { color: string; latlngs: [number, number][] }[] = []
  let currentColor = getSlopeColor(slopeBetween(track[0], track[1]))
  let current: [number, number][] = [[track[0].lat, track[0].lon]]
  for (let i = 1; i < track.length; i++) {
    const prev = track[i - 1], pt = track[i]
    const color = getSlopeColor(slopeBetween(prev, pt))
    if (color !== currentColor) {
      current.push([pt.lat, pt.lon])
      runs.push({ color: currentColor, latlngs: current })
      currentColor = color
      current = [[pt.lat, pt.lon]]
    } else {
      current.push([pt.lat, pt.lon])
    }
  }
  if (current.length > 1) runs.push({ color: currentColor, latlngs: current })
  return runs
}

function fmtNum(n: number): string {
  return n.toLocaleString('fr')
}

type TooltipDetail =
  | { kind: 'segment'; seg: MapSegment }
  | { kind: 'point'; label: string; dotColor: string; stats: PointStats }

interface TooltipState {
  x: number; y: number; km: number; alt: number; time: string; slope: number; elapsed: string
  detail: TooltipDetail | null
}

function HoverRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-200 text-[11px]">
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold text-neutral-800">{value}</span>
    </div>
  )
}

// Tooltip de la carte. Sur un point neutre du tracé : Distance/Altitude/Heure/Pente pour le
// point exact survolé. Sur une montée/descente : même carte que la tooltip de survol du profil
// (km en titre, puis pente/allure/temps écoulé/heure). Sur un point de passage
// (séparateur/ravitaillement) : titre + pastille + tag km, puis passage/temps écoulé.
function TooltipCard({ tooltip }: { tooltip: TooltipState }) {
  const { detail } = tooltip

  if (detail?.kind === 'segment') {
    return (
      <div className="whitespace-nowrap rounded-xl border border-neutral-20 bg-white/95 px-150 py-100 text-[11px] shadow-lg backdrop-blur-sm">
        <p className="text-[12px] font-bold text-neutral-800">{tooltip.km} km</p>
        <div className="mt-50 flex flex-col gap-25">
          <TooltipRow label="Pente" value={`${tooltip.slope.toFixed(1)}%`} color={getSlopeColor(tooltip.slope)} />
          <TooltipRow label="Allure" value={`${detail.seg.pace}/km`} />
          <TooltipRow label="Temps écoulé" value={tooltip.elapsed} />
          <TooltipRow label="Heure" value={tooltip.time} />
        </div>
      </div>
    )
  }

  if (detail?.kind === 'point') {
    return (
      <div className="rf-tooltip-card rf-tt">
        <div className="mb-100 flex items-center justify-between gap-75">
          <div className="flex items-center gap-75">
            <span className="rf-tt-dot" style={{ background: detail.dotColor }} />
            <span className="rf-tt-title">{detail.label}</span>
          </div>
          <ColorTag color="primary" label={`${detail.stats.km} km`} />
        </div>
        <div className="mt-50 flex flex-col gap-25">
          <HoverRow label="Passage à" value={detail.stats.timeLabel} />
          <HoverRow label="Temps écoulé" value={detail.stats.elapsedLabel} />
        </div>
      </div>
    )
  }

  return (
    <div className="rf-tooltip-card rf-tt">
      <div className="flex flex-col gap-50">
        <HoverRow label="Distance" value={`${tooltip.km} km`} />
        <HoverRow label="Altitude" value={`${fmtNum(tooltip.alt)} m`} />
        {tooltip.time && <HoverRow label="Heure" value={tooltip.time} />}
        <HoverRow label="Pente" value={`${tooltip.slope.toFixed(1)}%`} />
      </div>
    </div>
  )
}

export default function RouteMap({
  height = 320, track, segments = [], points = [], getStats, onAddPoint, onPointClick, onPointMove,
  hoverKm = null, onHoverKmChange, pendingKm = null, activePointId = null,
  pinnedPointId = null, onPinnedPointChange,
}: Props) {
  const isMobile = useIsMobile()
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile
  const pinnedPointIdRef = useRef(pinnedPointId)
  pinnedPointIdRef.current = pinnedPointId
  const onPinnedPointChangeRef = useRef(onPinnedPointChange)
  onPinnedPointChangeRef.current = onPinnedPointChange
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null)
  const mouseOverMapRef = useRef(false)
  const hoveringLayerRef = useRef(false)
  const onAddPointRef = useRef(onAddPoint)
  onAddPointRef.current = onAddPoint
  const onPointClickRef = useRef(onPointClick)
  onPointClickRef.current = onPointClick
  const onPointMoveRef = useRef(onPointMove)
  onPointMoveRef.current = onPointMove
  const getStatsRef = useRef(getStats)
  getStatsRef.current = getStats
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments
  const onHoverKmChangeRef = useRef(onHoverKmChange)
  onHoverKmChangeRef.current = onHoverKmChange
  const dragKmRef = useRef<number | null>(null)
  const justDraggedIdRef = useRef<string | null>(null)
  const [mode, setMode] = useState<LayerKey>('satellite')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const route: [number, number][] = track.map(p => [p.lat, p.lon])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    const bounds = L.latLngBounds(route)
    map.fitBounds(bounds, { padding: [24, 24] })

    tileRef.current = L.tileLayer(TILES.satellite.url, {
      attribution: TILES.satellite.attribution,
      maxZoom: 18,
    }).addTo(map)

    layerGroupRef.current = L.layerGroup().addTo(map)

    // Point de survol continu du tracé — pane dédié avec un z-index supérieur à la tooltip
    // custom (z-[2000]) pour qu'il reste TOUJOURS visible au-dessus, y compris quand la tooltip
    // le recouvre. Ajouté directement à la carte (hors layerGroup) pour survivre aux
    // clearLayers() des redraws.
    const hoverPane = map.createPane('hoverPane')
    hoverPane.style.zIndex = '2500'
    hoverPane.style.pointerEvents = 'none'

    hoverMarkerRef.current = L.circleMarker(route[0], {
      pane: 'hoverPane',
      radius: POINT_RADIUS,
      fillColor: '#8a9098',
      color: '#fff',
      weight: 2,
      fillOpacity: 0,
      opacity: 0,
      interactive: false,
    }).addTo(map)

    // Clic à proximité du tracé uniquement (marge de tolérance en pixels) — un clic ailleurs sur
    // la carte ne doit pas ouvrir le menu d'ajout de point.
    map.on('click', e => {
      if (!onAddPointRef.current || isMobileRef.current) return
      const km = nearestKmOnTrack(track, e.latlng.lat, e.latlng.lng)
      const [projLat, projLon] = latLngAtKm(track, km)
      const clickPt = map.latLngToContainerPoint(e.latlng)
      const projPt = map.latLngToContainerPoint(L.latLng(projLat, projLon))
      if (clickPt.distanceTo(projPt) > CLICK_PROXIMITY_PX) return
      onAddPointRef.current(Math.round(km * 10) / 10, e.originalEvent.clientX, e.originalEvent.clientY)
    })

    // Survol continu du tracé (hors marqueurs/segments) — tooltip Distance/Altitude/Heure
    // exactement à la position du curseur, et report du km survolé pour synchroniser le profil.
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      mouseOverMapRef.current = true
      if (hoveringLayerRef.current) return
      const km = nearestKmOnTrack(track, e.latlng.lat, e.latlng.lng)
      const [lat, lon] = latLngAtKm(track, km)
      const projPt = map.latLngToContainerPoint(L.latLng(lat, lon))
      const cursorPt = map.latLngToContainerPoint(e.latlng)
      if (projPt.distanceTo(cursorPt) > HOVER_PROXIMITY_PX) {
        hoverMarkerRef.current?.setStyle({ opacity: 0, fillOpacity: 0 })
        setTooltip(null)
        onHoverKmChangeRef.current?.(null)
        return
      }
      const roundedKm = Math.round(km * 10) / 10
      hoverMarkerRef.current?.setLatLng([lat, lon])
      hoverMarkerRef.current?.setStyle({ opacity: 1, fillOpacity: 1, radius: POINT_RADIUS, fillColor: '#8a9098' })
      onHoverKmChangeRef.current?.(roundedKm)
      const stats = getStatsRef.current?.(roundedKm)
      const seg = segmentsRef.current.find(s => roundedKm >= s.from && roundedKm <= s.to) ?? null
      const cp = e.containerPoint
      setTooltip({
        x: cp.x, y: cp.y,
        km: roundedKm,
        alt: stats ? Math.round(stats.alt) : 0,
        time: stats?.timeLabel ?? '',
        elapsed: stats?.elapsedLabel ?? '',
        slope: slopeAtKmOnTrack(track, roundedKm),
        detail: seg ? { kind: 'segment', seg } : null,
      })
    })

    map.on('mouseout', () => {
      mouseOverMapRef.current = false
      hoveringLayerRef.current = false
      hoverMarkerRef.current?.setStyle({ opacity: 0, fillOpacity: 0 })
      setTooltip(null)
      onHoverKmChangeRef.current?.(null)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      tileRef.current = null
      layerGroupRef.current = null
      hoverMarkerRef.current = null
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

  // Tooltip épinglée (mobile) : pilotée entièrement par l'état partagé avec le profil, pour
  // qu'un tap dans une vue ferme/synchronise la tooltip de l'autre.
  useEffect(() => {
    if (!isMobile) return
    const map = mapRef.current
    if (!map) return
    if (pinnedPointId == null) {
      setTooltip(null)
      return
    }
    const p = points.find(pt => pt.id === pinnedPointId)
    const stats = p ? getStats?.(p.km) : null
    if (!p || !stats) {
      setTooltip(null)
      return
    }
    const [lat, lon] = latLngAtKm(track, p.km)
    const cp = map.latLngToContainerPoint(L.latLng(lat, lon))
    const isActive = activePointId === p.id
    const dotColor = isActive ? SECONDARY : p.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR
    setTooltip({
      x: cp.x, y: cp.y,
      km: stats.km,
      alt: Math.round(stats.alt),
      time: stats.timeLabel,
      elapsed: stats.elapsedLabel,
      slope: slopeAtKmOnTrack(track, p.km),
      detail: { kind: 'point', label: p.label, dotColor, stats },
    })
  }, [isMobile, pinnedPointId, points, getStats, track, activePointId])

  // Survol reporté par le profil (chart -> carte) : n'agit que si la souris n'est pas déjà sur
  // la carte elle-même (qui reste alors seule maîtresse de son propre marqueur de survol).
  useEffect(() => {
    const marker = hoverMarkerRef.current
    if (!marker || mouseOverMapRef.current || pendingKm != null) return
    if (hoverKm == null) {
      marker.setStyle({ opacity: 0, fillOpacity: 0 })
      return
    }
    const [lat, lon] = latLngAtKm(track, hoverKm)
    marker.setLatLng([lat, lon])
    marker.setStyle({ opacity: 1, fillOpacity: 1, radius: POINT_RADIUS, fillColor: '#8a9098' })
  }, [hoverKm, pendingKm, track])

  // Point en cours d'ajout (popup ouverte) : le point de survol devient jaune et reste figé
  // à cet endroit tant que la popup est ouverte.
  useEffect(() => {
    const marker = hoverMarkerRef.current
    if (!marker) return
    if (pendingKm == null) return
    const [lat, lon] = latLngAtKm(track, pendingKm)
    marker.setLatLng([lat, lon])
    marker.setStyle({ opacity: 1, fillOpacity: 1, radius: POINT_RADIUS_HOVER, fillColor: SECONDARY })
  }, [pendingKm, track])

  // Redraw route/segments/markers whenever the underlying data changes
  useEffect(() => {
    const map = mapRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return
    layerGroup.clearLayers()

    // Trait du parcours coloré par la pente (mêmes bandes que le profil), avec bordure blanche
    // extérieure — une polyligne blanche plus large dessinée sous les tronçons colorés.
    L.polyline(route, { color: '#ffffff', weight: 6.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layerGroup)
    for (const run of getSlopeColoredPolylines(track)) {
      L.polyline(run.latlngs, { color: run.color, weight: 3.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layerGroup)
    }

    for (const p of points) {
      const [lat, lon] = latLngAtKm(track, p.km)
      const isActive = activePointId === p.id
      const marker = L.circleMarker([lat, lon], {
        radius: isActive ? POINT_RADIUS_ACTIVE : POINT_RADIUS,
        fillColor: isActive ? SECONDARY : (p.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR),
        stroke: !p.isRavito,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 1,
      }).addTo(layerGroup)

      function showPointTooltip(ev: L.LeafletMouseEvent) {
        const stats = getStatsRef.current?.(p.km)
        if (!stats) return
        const cp = ev.containerPoint
        const dotColor = isActive ? SECONDARY : p.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR
        setTooltip({
          x: cp.x, y: cp.y,
          km: stats.km,
          alt: Math.round(stats.alt),
          time: stats.timeLabel,
          elapsed: stats.elapsedLabel,
          slope: slopeAtKmOnTrack(track, p.km),
          detail: { kind: 'point', label: p.label, dotColor, stats },
        })
      }

      marker.on('mouseover', (ev: L.LeafletMouseEvent) => {
        hoveringLayerRef.current = true
        marker.setStyle({ radius: isActive ? POINT_RADIUS_ACTIVE : POINT_RADIUS_HOVER })
        showPointTooltip(ev)
      })
      marker.on('mousemove', (ev: L.LeafletMouseEvent) => {
        const cp = ev.containerPoint
        setTooltip(t => (t ? { ...t, x: cp.x, y: cp.y } : t))
      })
      marker.on('mouseout', () => {
        hoveringLayerRef.current = false
        if (dragKmRef.current == null) marker.setStyle({ radius: isActive ? POINT_RADIUS_ACTIVE : POINT_RADIUS })
        setTooltip(null)
      })

      marker.on('click', (ev: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(ev)
        if (justDraggedIdRef.current === p.id) {
          justDraggedIdRef.current = null
          return
        }
        // Lecture seule en mobile : pas de menu (suppression/conversion) — le clic (dé)pingle la
        // tooltip via l'état partagé avec le profil, qui se charge de l'affichage (cf. effet plus
        // bas), pour rester synchronisé avec l'autre vue.
        if (isMobileRef.current) {
          onPinnedPointChangeRef.current?.(pinnedPointIdRef.current === p.id ? null : p.id)
          return
        }
        onPointClickRef.current?.(p.id, ev.originalEvent.clientX, ev.originalEvent.clientY)
      })

      // Appui long puis glisser pour repositionner le point (calé sur le tracé) — désactivé en mobile
      marker.on('mousedown', (ev: L.LeafletMouseEvent) => {
        if (isMobileRef.current) return
        L.DomEvent.stopPropagation(ev)
        const startPt = map.latLngToContainerPoint(ev.latlng)
        let longPressFired = false
        let cancelled = false

        const timer = window.setTimeout(() => {
          if (cancelled) return
          longPressFired = true
          map.dragging.disable()
          marker.setStyle({ radius: POINT_RADIUS_HOVER })
        }, LONG_PRESS_MS)

        const onMouseMove = (e2: L.LeafletMouseEvent) => {
          if (!longPressFired) {
            const nowPt = map.latLngToContainerPoint(e2.latlng)
            if (startPt.distanceTo(nowPt) > MOVE_CANCEL_PX) {
              cancelled = true
              window.clearTimeout(timer)
              map.off('mousemove', onMouseMove)
              map.off('mouseup', onMouseUp)
            }
            return
          }
          const km = nearestKmOnTrack(track, e2.latlng.lat, e2.latlng.lng)
          const [lat2, lon2] = latLngAtKm(track, km)
          marker.setLatLng([lat2, lon2])
          dragKmRef.current = Math.round(km * 10) / 10
        }

        const onMouseUp = () => {
          window.clearTimeout(timer)
          map.off('mousemove', onMouseMove)
          map.off('mouseup', onMouseUp)
          if (longPressFired) {
            map.dragging.enable()
            marker.setStyle({ radius: isActive ? POINT_RADIUS_ACTIVE : POINT_RADIUS })
            if (dragKmRef.current != null) {
              justDraggedIdRef.current = p.id
              onPointMoveRef.current?.(p.id, dragKmRef.current)
            }
          }
          dragKmRef.current = null
        }

        map.on('mousemove', onMouseMove)
        map.on('mouseup', onMouseUp)
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, segments, points, getStats, activePointId])

  const MODES: { key: LayerKey; label: string }[] = [
    { key: 'satellite', label: 'Satellite' },
    { key: 'terrain', label: 'Terrain' },
  ]

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 overflow-hidden">
        <div ref={containerRef} className={`absolute inset-0${onAddPoint ? ' cursor-crosshair' : ''}`} />
      </div>

      {/* Tooltip custom — toujours au-dessus, jamais rognée par les coins arrondis de la carte.
          Masquée dès qu'une popup de clic (ajout ou menu de point existant) est ouverte, qui
          prend le relais visuellement. Bascule à gauche du point quand il n'y a pas assez de
          place à droite (marge estimée sur la largeur de la tooltip), pour ne jamais déborder
          de l'écran sur les petits conteneurs. */}
      {tooltip && pendingKm == null && activePointId == null && (() => {
        const containerWidth = containerRef.current?.clientWidth ?? Infinity
        const flipLeft = tooltip.x + 14 + TOOLTIP_WIDTH_ESTIMATE > containerWidth
        return (
          <div
            className="pointer-events-none absolute z-[2000]"
            style={
              flipLeft
                ? { left: tooltip.x - 14, top: Math.max(4, tooltip.y - 10), transform: 'translateX(-100%)' }
                : { left: tooltip.x + 14, top: Math.max(4, tooltip.y - 10) }
            }
          >
            <TooltipCard tooltip={tooltip} />
          </div>
        )
      })()}

      {/* Contrôles de zoom — remplace le zoomControl natif de Leaflet (carré) par le même style
          arrondi que les contrôles de zoom du profil altimétrique. */}
      <div className="absolute left-[10px] top-[10px] z-[1000] flex flex-col overflow-hidden rounded-full border border-neutral-20 bg-white shadow-widget">
        <button
          type="button"
          aria-label="Zoom avant"
          onClick={() => mapRef.current?.zoomIn()}
          className="flex size-[26px] items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-10"
        >
          <Plus className="size-[13px]" strokeWidth={2.5} />
        </button>
        <div className="h-px bg-neutral-20" />
        <button
          type="button"
          aria-label="Zoom arrière"
          onClick={() => mapRef.current?.zoomOut()}
          className="flex size-[26px] items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-10"
        >
          <Minus className="size-[13px]" strokeWidth={2.5} />
        </button>
      </div>

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
