import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AltimetryPoint } from './AltimetryChart'
import { paceToSec } from '../pages/RacePlan/format'
import type { PointStats } from '../pages/RacePlan/trackStats'
import { getPaceColor, getPaceGradientStops } from '../pages/RacePlan/paceColors'
import { SLOPE_BANDS, getSlopeColor, WAYPOINT_COLOR, RAVITO_COLOR } from '../pages/RacePlan/slopeColors'
import TooltipRow from './TooltipRow'
import ColorTag from './ColorTag'
import { useIsMobile } from '../hooks/useIsMobile'

export function SlopeLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-200 gap-y-75">
      <span className="eyebrow text-[9px] uppercase tracking-wider text-neutral-80">Pente</span>
      {SLOPE_BANDS.map(b => (
        <span key={b.label} className="flex items-center gap-50 text-[10px] text-neutral-500">
          <span className="inline-block size-100 shrink-0 rounded-sm" style={{ background: b.color }} />
          {b.label}
        </span>
      ))}
    </div>
  )
}

export interface ChartPoint { id: string; km: number; isRavito: boolean; label: string }
export interface HoverSegment { id: string; from: number; to: number; label: string; dp: number; dm: number; timeMins: number; pace: string }

interface Props {
  data: AltimetryPoint[]
  height?: number
  points?: ChartPoint[]
  segments?: HoverSegment[]
  distanceStep?: number
  showLegend?: boolean
  getStats?: (km: number) => PointStats
  onAddPoint?: (km: number, clientX: number, clientY: number) => void
  onPointClick?: (id: string, clientX: number, clientY: number) => void
  onPointMove?: (id: string, newKm: number) => void
  /** Km survolé, partagé avec la carte pour synchroniser les deux vues. */
  hoverKm?: number | null
  onHoverKmChange?: (km: number | null) => void
  /** Km du point en cours d'ajout (popup ouverte) — affiché en secondary sur la courbe. */
  pendingKm?: number | null
  /** Id du point existant dont le menu est ouvert — affiché en secondary sur le tracé. */
  activePointId?: string | null
  /** Appelé à chaque scroll (zoom ou pan) — le parent en profite pour fermer une popup ouverte. */
  onScroll?: () => void
  /** Id du point dont la tooltip est épinglée en mobile (lecture seule), partagé avec la carte
   * pour qu'un tap dans une vue ferme/synchronise la tooltip de l'autre. */
  pinnedPointId?: string | null
  onPinnedPointChange?: (id: string | null) => void
}

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 6
const MIN_ZOOM_FRACTION = 0.03

function niceStep(span: number): number {
  const candidates = [0.2, 0.5, 1, 2, 5, 10, 20, 50]
  const target = span / 6
  return candidates.reduce((best, c) => (Math.abs(c - target) < Math.abs(best - target) ? c : best), candidates[0])
}

export default function SlopeAltimetryChart({
  data,
  height = 200,
  points = [],
  segments,
  distanceStep = 20,
  showLegend = true,
  getStats,
  onAddPoint,
  onPointClick,
  onPointMove,
  hoverKm = null,
  onHoverKmChange,
  pendingKm = null,
  activePointId = null,
  onScroll,
  pinnedPointId = null,
  onPinnedPointChange,
}: Props) {
  const isMobile = useIsMobile()
  const svgWrapRef = useRef<HTMLDivElement>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement>(null)
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll
  // Verrouille l'axe (x = pan, y = zoom) sur le premier événement d'un geste de molette/trackpad
  // et le garde jusqu'à une pause de 200ms : un swipe horizontal au trackpad envoie des deltaY
  // parasites par à-coups, qui sans verrou faisaient basculer certains événements en zoom.
  const wheelAxisRef = useRef<'x' | 'y' | null>(null)
  const wheelAxisTimerRef = useRef<number | null>(null)
  const [scrub, setScrub] = useState<{ km: number; px: number } | null>(null)
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragPreviewKm, setDragPreviewKm] = useState<number | null>(null)

  // En mobile, la tooltip épinglée est pilotée par l'état partagé avec la carte (tap dans une
  // vue → ferme/synchronise l'autre) plutôt que par un simple survol local.
  useEffect(() => {
    if (isMobile) setHoveredPointId(pinnedPointId)
  }, [isMobile, pinnedPointId])

  const maxKmFull = data[data.length - 1].km
  const [view, setView] = useState<{ start: number; end: number }>({ start: 0, end: maxKmFull })
  const isZoomed = view.start > 1e-6 || view.end < maxKmFull - 1e-6

  // Largeur réelle (px) du conteneur, mesurée en continu : le viewBox du SVG doit matcher
  // exactement la boîte affichée (w-full × height fixe), sinon preserveAspectRatio="none"
  // étire le contenu de façon non uniforme selon la résolution d'écran (cercles, pointillés
  // et texte déformés différemment en X et en Y).
  const [containerWidth, setContainerWidth] = useState(800)
  useEffect(() => {
    const el = svgWrapRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width) setContainerWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const VW = containerWidth
  // En mobile, la légende d'altitude (gauche) disparaît : ML n'a plus besoin de réserver de
  // place pour son texte. MB reste plus grand que 4 pour ne pas rogner les libellés de
  // l'axe des distances (positionnés à baseY + 13) — seuls MT/ML/MR descendent à 4px.
  const MT = isMobile ? 4 : 8, MB = isMobile ? 18 : 28, ML = isMobile ? 4 : 50, MR = isMobile ? 4 : 8
  const chartH = height - MT - MB
  const chartW = VW - ML - MR

  const minAlt = Math.min(...data.map(d => d.alt))
  const maxAlt = Math.max(...data.map(d => d.alt))
  const altRange = maxAlt - minAlt || 1
  const viewSpan = view.end - view.start
  const minZoomKm = Math.max(0.3, maxKmFull * MIN_ZOOM_FRACTION)

  const toX = (km: number) => ML + ((km - view.start) / viewSpan) * chartW
  const toY = (alt: number) => MT + (1 - (alt - minAlt) / altRange) * chartH
  const baseY = MT + chartH

  function altAtKm(km: number): number {
    let idx = 0
    while (idx < data.length - 2 && data[idx + 1].km <= km) idx++
    const p0 = data[idx], p1 = data[Math.min(idx + 1, data.length - 1)]
    const t = p0.km === p1.km ? 0 : (km - p0.km) / (p1.km - p0.km)
    return p0.alt + t * (p1.alt - p0.alt)
  }

  function slopeAtKm(km: number): number {
    let idx = 0
    while (idx < data.length - 2 && data[idx + 1].km <= km) idx++
    const p0 = data[idx], p1 = data[Math.min(idx + 1, data.length - 1)]
    const dKm = p1.km - p0.km
    return dKm > 0 ? ((p1.alt - p0.alt) / (dKm * 1000)) * 100 : 0
  }

  // Sommets/creux (km où la pente s'inverse) déduits des données brutes — la fenêtre de lissage
  // ne doit jamais les traverser, sinon elle mélangerait une portion de montée avec une portion
  // de descente.
  const extremaKms = useMemo(() => {
    const extrema: number[] = []
    let prevSign = 0
    for (let i = 1; i < data.length; i++) {
      const diff = data[i].alt - data[i - 1].alt
      const sign = diff > 0 ? 1 : diff < 0 ? -1 : 0
      if (sign !== 0) {
        if (prevSign !== 0 && sign !== prevSign) extrema.push(data[i - 1].km)
        prevSign = sign
      }
    }
    return extrema
  }, [data])

  // Pente lissée sur une fenêtre de ~500m (centrée, clampée aux bornes du parcours et à
  // l'extremum le plus proche de part et d'autre) — utilisée uniquement pour la couleur du
  // remplissage, afin d'éviter que le bruit du relevé altimétrique (pente instantanée entre deux
  // échantillons très rapprochés) fasse changer la couleur trop souvent. Le contour noir du
  // terrain, lui, reste fidèle aux données brutes.
  const SLOPE_SMOOTH_KM = 0.5
  function smoothedSlopeAtKm(km: number): number {
    const half = SLOPE_SMOOTH_KM / 2
    let kmA = Math.max(0, km - half)
    let kmB = Math.min(maxKmFull, km + half)
    for (const e of extremaKms) {
      if (e > kmA && e <= km) kmA = e
      if (e < kmB && e >= km) kmB = e
    }
    const dKm = kmB - kmA
    return dKm > 0 ? ((altAtKm(kmB) - altAtKm(kmA)) / (dKm * 1000)) * 100 : 0
  }

  // Interpolation fine (résolution adaptative au zoom) pour les bandes de pente colorées
  const STEP = Math.max(0.03, viewSpan / 300)
  const pts: AltimetryPoint[] = []
  for (let km = view.start; km < view.end; km += STEP) {
    pts.push({ km, alt: altAtKm(km) })
  }
  pts.push({ km: view.end, alt: altAtKm(view.end) })

  // Regroupe les tranches consécutives de même couleur (pente lissée) en un seul polygone
  // continu — dessiner un polygone par toute petite tranche laissait des liserés blancs entre
  // trapèzes adjacents (anti-aliasing SVG) même quand ils partageaient la même couleur.
  const slopeRuns: { points: AltimetryPoint[]; color: string }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1]
    const color = getSlopeColor(smoothedSlopeAtKm((p0.km + p1.km) / 2))
    const current = slopeRuns[slopeRuns.length - 1]
    if (current && current.color === color) {
      current.points.push(p1)
    } else {
      slopeRuns.push({ points: [p0, p1], color })
    }
  }

  // Altitude grid lines (échelle verticale stable, indépendante du zoom)
  const rawStep = Math.ceil(altRange / 3 / 100) * 100
  const altTicks: number[] = []
  for (let a = Math.ceil((minAlt + 50) / rawStep) * rawStep; a < maxAlt - 50; a += rawStep) {
    altTicks.push(a)
  }

  // Distance tick marks — pas adaptatif quand on est zoomé
  const step = isZoomed ? niceStep(viewSpan) : distanceStep
  const distTicks: number[] = []
  for (let km = Math.ceil(view.start / step) * step; km <= view.end + 1e-6; km += step) {
    distTicks.push(+km.toFixed(2))
  }
  if (distTicks.length === 0 || distTicks[0] > view.start + 1e-6) distTicks.unshift(+view.start.toFixed(2))
  if (distTicks[distTicks.length - 1] < view.end - 1e-6) distTicks.push(+view.end.toFixed(2))

  const terrainPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.km).toFixed(1)},${toY(p.alt).toFixed(1)}`)
    .join(' ')

  // Courbe d'allure (fonction en escalier, une valeur constante par segment) — domaine min/max
  // pour le positionnement vertical, et moyenne pondérée par la distance pour la coloration.
  const paceDomain = useMemo(() => {
    if (!segments || segments.length === 0) return null
    const secs = segments.map(s => paceToSec(s.pace))
    const totalDist = segments.reduce((acc, s) => acc + (s.to - s.from), 0) || 1
    const avg = segments.reduce((acc, s, i) => acc + secs[i] * (s.to - s.from), 0) / totalDist
    return { min: Math.min(...secs), max: Math.max(...secs), avg }
  }, [segments])

  function paceToYFn(sec: number) {
    if (!paceDomain) return baseY
    const range = paceDomain.max - paceDomain.min || 1
    return MT + ((sec - paceDomain.min) / range) * chartH
  }

  // Étapes colorées de la courbe d'allure — coloration relative à l'allure de la course
  // (rouge = rapide, vert = allure moyenne, bleu = lente), PAS à la pente du terrain.
  // Connecteurs verticaux en dégradé entre deux paliers, comme happy-cabri-beta.
  const paceSteps = useMemo(() => {
    if (!segments || segments.length === 0 || !paceDomain) return null
    const secs = segments.map(s => paceToSec(s.pace))
    return segments.map((seg, i) => {
      const sec = secs[i]
      const nextSec = i < segments.length - 1 ? secs[i + 1] : sec
      return {
        id: seg.id,
        x0: toX(seg.from),
        x1: toX(seg.to),
        y: paceToYFn(sec),
        yNext: paceToYFn(nextSec),
        color: getPaceColor(sec, paceDomain.avg, paceDomain.min, paceDomain.max),
        connectorStops: getPaceGradientStops(sec, nextSec, paceDomain.avg, paceDomain.min, paceDomain.max),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, paceDomain, view.start, view.end, chartH])

  function kmFromClientX(clientX: number, rect: DOMRect, v: { start: number; end: number } = view): number {
    const relX = (clientX - rect.left) / rect.width
    const svgX = relX * VW
    const span = v.end - v.start
    return Math.max(v.start, Math.min(v.end, v.start + ((svgX - ML) / chartW) * span))
  }

  // ── Molette (listener natif non-passif pour pouvoir bloquer le scroll de page) : scroll
  // vertical (haut/bas) = zoom. Scroll horizontal (gauche/droite) = pan si déjà zoomé, sinon
  // ignoré — ne doit jamais déclencher un zoom/dézoom. ──
  useEffect(() => {
    const el = svgWrapRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      onScrollRef.current?.()
      const rect = el!.getBoundingClientRect()

      if (wheelAxisTimerRef.current != null) window.clearTimeout(wheelAxisTimerRef.current)
      wheelAxisTimerRef.current = window.setTimeout(() => { wheelAxisRef.current = null }, 200)
      if (wheelAxisRef.current == null) {
        wheelAxisRef.current = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? 'x' : 'y'
      }

      if (wheelAxisRef.current === 'x') {
        e.preventDefault()
        setView(v => {
          const span = v.end - v.start
          if (span >= maxKmFull - 1e-6) return v
          const deltaKm = (e.deltaX / rect.width) * span
          const newStart = Math.max(0, Math.min(v.start + deltaKm, maxKmFull - span))
          return { start: newStart, end: newStart + span }
        })
        return
      }

      e.preventDefault()
      const relX = (e.clientX - rect.left) / rect.width
      setView(v => {
        const span = v.end - v.start
        const svgX = relX * VW
        const kmAtCursor = v.start + Math.max(0, Math.min(1, (svgX - ML) / chartW)) * span
        const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
        const newSpan = Math.min(maxKmFull, Math.max(minZoomKm, span * factor))
        let newStart = kmAtCursor - relX * newSpan
        newStart = Math.max(0, Math.min(newStart, maxKmFull - newSpan))
        return { start: newStart, end: newStart + newSpan }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (wheelAxisTimerRef.current != null) window.clearTimeout(wheelAxisTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxKmFull, minZoomKm, chartW])

  function zoomBy(factor: number) {
    setView(v => {
      const span = v.end - v.start
      const center = (v.start + v.end) / 2
      const newSpan = Math.min(maxKmFull, Math.max(minZoomKm, span * factor))
      let newStart = center - newSpan / 2
      newStart = Math.max(0, Math.min(newStart, maxKmFull - newSpan))
      return { start: newStart, end: newStart + newSpan }
    })
  }

  // ── Scrollbar horizontale (visible seulement quand zoomé) : glisser le curseur ou cliquer
  // directement sur la piste pour se déplacer dans la vue zoomée. ──
  function panViewTo(newStart: number) {
    const span = view.end - view.start
    const clamped = Math.max(0, Math.min(newStart, maxKmFull - span))
    setView({ start: clamped, end: clamped + span })
  }

  function panBy(factor: number) {
    panViewTo(view.start + viewSpan * factor)
  }

  function handleScrollbarThumbMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    const track = scrollbarTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const startClientX = e.clientX
    const startViewStart = view.start

    function onMove(ev: MouseEvent) {
      const deltaKm = ((ev.clientX - startClientX) / rect.width) * maxKmFull
      panViewTo(startViewStart + deltaKm)
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function handleScrollbarTrackMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const track = scrollbarTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const span = view.end - view.start
    panViewTo(relX * maxKmFull - span / 2)
  }

  // ── Fond du graphique : pan (si déjà zoomé) vs clic pour ajouter un point ──
  const bgDragRef = useRef<{ startClientX: number; rect: DOMRect; startView: { start: number; end: number }; moved: boolean } | null>(null)

  function handleBgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    bgDragRef.current = { startClientX: e.clientX, rect: e.currentTarget.getBoundingClientRect(), startView: view, moved: false }
  }

  function handleBgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const km = kmFromClientX(e.clientX, rect)
    const roundedKm = Math.round(km * 10) / 10
    setScrub({ km: roundedKm, px: toX(km) })
    onHoverKmChange?.(roundedKm)

    const drag = bgDragRef.current
    if (drag) {
      if (Math.abs(e.clientX - drag.startClientX) > MOVE_CANCEL_PX) drag.moved = true
      if (drag.moved) {
        const kmStart = kmFromClientX(drag.startClientX, drag.rect, drag.startView)
        const kmNow = kmFromClientX(e.clientX, drag.rect, drag.startView)
        const span = drag.startView.end - drag.startView.start
        let newStart = drag.startView.start + (kmStart - kmNow)
        newStart = Math.max(0, Math.min(newStart, maxKmFull - span))
        setView({ start: newStart, end: newStart + span })
      }
    }
  }

  function handleBgMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    const drag = bgDragRef.current
    bgDragRef.current = null
    if (drag && !drag.moved && onAddPoint && !isMobile) {
      const km = kmFromClientX(e.clientX, drag.rect)
      onAddPoint(Math.round(km * 10) / 10, e.clientX, e.clientY)
    }
  }

  function handleMouseLeaveSvg() {
    setScrub(null)
    onHoverKmChange?.(null)
    bgDragRef.current = null
  }

  // ── Point existant : clic (menu) vs appui long puis glisser (déplacement) ──
  function handlePointMouseDown(e: React.MouseEvent<SVGGElement>, point: ChartPoint) {
    // Lecture seule en mobile : ni menu (suppression/conversion), ni déplacement par glisser.
    // Le tap est géré par onClick (fiable au toucher, contrairement à onMouseDown) plus bas.
    if (isMobile) return
    e.stopPropagation()
    const clickX = e.clientX, clickY = e.clientY
    const startClientX = e.clientX
    const svgEl = e.currentTarget.ownerSVGElement
    let longPressFired = false
    let cancelled = false

    const timer = window.setTimeout(() => {
      if (cancelled) return
      longPressFired = true
      setDraggingId(point.id)
      setDragPreviewKm(point.km)
    }, LONG_PRESS_MS)

    function onMove(ev: MouseEvent) {
      if (!longPressFired) {
        if (Math.abs(ev.clientX - startClientX) > MOVE_CANCEL_PX) {
          cancelled = true
          window.clearTimeout(timer)
        }
        return
      }
      if (!svgEl) return
      const rect = svgEl.getBoundingClientRect()
      const km = Math.round(kmFromClientX(ev.clientX, rect) * 10) / 10
      setDragPreviewKm(km)
    }

    function onUp(ev: MouseEvent) {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (longPressFired) {
        if (svgEl) {
          const rect = svgEl.getBoundingClientRect()
          const km = Math.round(kmFromClientX(ev.clientX, rect) * 10) / 10
          onPointMove?.(point.id, km)
        }
      } else if (!cancelled) {
        onPointClick?.(point.id, clickX, clickY)
      }
      setDraggingId(null)
      setDragPreviewKm(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function displayedKm(point: ChartPoint): number {
    return draggingId === point.id && dragPreviewKm != null ? dragPreviewKm : point.km
  }

  const activePointTooltip = (() => {
    const id = draggingId ?? hoveredPointId
    if (!id || !getStats) return null
    const point = points.find(p => p.id === id)
    if (!point) return null
    const km = displayedKm(point)
    return { point, stats: getStats(km), px: toX(km) }
  })()

  // Km affiché pour le point de survol : priorité au point en cours d'ajout (popup ouverte),
  // puis au survol local, puis au survol reporté par la carte (synchro croisée).
  const displayHoverKm = pendingKm ?? scrub?.km ?? (hoveredPointId || draggingId ? null : hoverKm)
  const isPendingHover = pendingKm != null
  const hoverDotPx = displayHoverKm != null ? toX(displayHoverKm) : null
  const hoverDotPy = displayHoverKm != null ? toY(altAtKm(displayHoverKm)) : null

  const displayStats = !activePointTooltip && displayHoverKm != null && getStats ? getStats(displayHoverKm) : null

  return (
    <div className="relative">
      {/* Contrôles de zoom — ancrés au coin haut-gauche du composant tout entier (même position
          que sur la carte, remonté de 20px de plus). */}
      <div className="absolute left-[10px] top-[-10px] z-10 flex flex-col overflow-hidden rounded-full border border-neutral-20 bg-white shadow-widget">
        <button
          type="button"
          aria-label="Zoom avant"
          onClick={() => zoomBy(1 / 1.4)}
          className="flex size-[26px] items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-10"
        >
          <Plus className="size-[13px]" strokeWidth={2.5} />
        </button>
        <div className="h-px bg-neutral-20" />
        <button
          type="button"
          aria-label="Zoom arrière"
          onClick={() => zoomBy(1.4)}
          className="flex size-[26px] items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-10"
        >
          <Minus className="size-[13px]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Étiquettes km — pilule inclinée par point de passage, cliquable (ouvre le menu du point,
          sauf en mobile où tout est lecture seule). Filtrées sur la vue courante : hors zoom, un
          point hors-cadre déborderait sans être clippé (contrairement au SVG, cette rangée est un
          simple overlay HTML). En mobile, seuls les ravitos restent affichés, en 90° pour prendre
          le moins de largeur possible. */}
      {points.length > 0 && (
        <div className="relative h-[26px] overflow-visible">
          {points.filter(p => {
            const km = displayedKm(p)
            return km >= view.start && km <= view.end && (!isMobile || p.isRavito)
          }).map(p => {
            const km = displayedKm(p)
            const isActive = activePointId === p.id
            const isHovered = hoveredPointId === p.id || draggingId === p.id || isActive
            return (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => { if (!isMobile) setHoveredPointId(p.id) }}
                onMouseLeave={() => { if (!isMobile) setHoveredPointId(null) }}
                onClick={e => {
                  e.stopPropagation()
                  if (isMobile) onPinnedPointChange?.(pinnedPointId === p.id ? null : p.id)
                  else onPointClick?.(p.id, e.clientX, e.clientY)
                }}
                className="absolute bottom-0 origin-bottom-left whitespace-nowrap rounded-[4px] px-75 py-25 text-[9px] font-bold shadow-sm transition-colors"
                style={{
                  left: `${(toX(km) / VW) * 100}%`,
                  transform: `rotate(${isMobile ? -90 : -40}deg)`,
                  // En mobile, l'étiquette pivote à la verticale : l'origine de rotation est
                  // décalée de la moitié de sa propre hauteur pour que la barre verticale
                  // résultante soit centrée sur le pointillé (km), pas collée à sa gauche.
                  transformOrigin: isMobile ? '8px 100%' : undefined,
                  background: isHovered ? 'var(--color-secondary-500)' : p.isRavito ? '#F5D0FE' : WAYPOINT_COLOR,
                  color: isHovered ? '#303030' : p.isRavito ? RAVITO_COLOR : '#ffffff',
                }}
              >
                {km} km
              </button>
            )
          })}
        </div>
      )}

      <div ref={svgWrapRef} className="relative select-none">
        <svg
          viewBox={`0 0 ${VW} ${height}`}
          preserveAspectRatio="none"
          className={`w-full${onAddPoint && !isMobile ? ' cursor-crosshair' : ''}`}
          style={{ height }}
          onMouseDown={handleBgMouseDown}
          onMouseMove={handleBgMouseMove}
          onMouseUp={handleBgMouseUp}
          onMouseLeave={handleMouseLeaveSvg}
        >
          {/* Altitude grid lines — masquées en mobile pour laisser le graphique prendre toute la largeur */}
          {!isMobile && altTicks.map(a => (
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

          {/* Slope-colored fill — un seul polygone continu par bande de couleur (pente lissée sur
              ~300m), pas un par petite tranche : sinon les bords adjacents laissaient des liserés
              blancs (anti-aliasing SVG) même entre deux tranches de la même couleur. */}
          {slopeRuns.map((run, i) => {
            const first = run.points[0]
            const last = run.points[run.points.length - 1]
            const top = run.points.map(p => `${toX(p.km).toFixed(1)},${toY(p.alt).toFixed(1)}`).join(' ')
            return (
              <polygon
                key={i}
                points={`${toX(first.km).toFixed(1)},${baseY} ${top} ${toX(last.km).toFixed(1)},${baseY}`}
                fill={run.color}
                opacity={0.92}
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

          {/* Courbe d'allure — trait continu, coloré par allure relative (rouge rapide → bleu lent).
              gradientUnits="userSpaceOnUse" avec des coordonnées explicites : un connecteur
              vertical a une bounding box de largeur nulle, ce qui casse le dégradé par défaut
              (objectBoundingBox) dans la plupart des moteurs de rendu. */}
          {paceSteps && (
            <>
              <defs>
                {paceSteps.slice(0, -1).map(s => (
                  <linearGradient
                    key={s.id} id={`pace-grad-${s.id}`}
                    gradientUnits="userSpaceOnUse"
                    x1={s.x1} y1={s.y} x2={s.x1} y2={s.yNext}
                  >
                    {s.connectorStops.map((stop, i) => (
                      <stop key={i} offset={`${(stop.offset * 100).toFixed(2)}%`} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                ))}
              </defs>
              {paceSteps.map((s, i) => (
                <g key={s.id}>
                  <line x1={s.x0} y1={s.y} x2={s.x1} y2={s.y} stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
                  {i < paceSteps.length - 1 && (
                    <line x1={s.x1} y1={s.y} x2={s.x1} y2={s.yNext} stroke={`url(#pace-grad-${s.id})`} strokeWidth={2.5} strokeLinecap="round" />
                  )}
                </g>
              ))}
            </>
          )}

          {/* Séparateurs / ravitaillements — barre verticale pointillée rose ou noire + point */}
          {points.map(p => {
            const km = displayedKm(p)
            const isActive = activePointId === p.id
            const isHovered = hoveredPointId === p.id || draggingId === p.id || isActive
            const color = isHovered ? 'var(--color-secondary-500)' : p.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR
            return (
              <g
                key={p.id}
                className="cursor-pointer"
                style={{ cursor: draggingId === p.id ? 'grabbing' : 'grab' }}
                onMouseDown={e => handlePointMouseDown(e, p)}
                onMouseEnter={() => { if (!isMobile) setHoveredPointId(p.id) }}
                onMouseLeave={() => { if (!isMobile) setHoveredPointId(null) }}
                onClick={e => {
                  e.stopPropagation()
                  if (isMobile) onPinnedPointChange?.(pinnedPointId === p.id ? null : p.id)
                }}
              >
                {/* y1=0 (et non MT) : le trait doit remonter jusqu'au bord haut du SVG pour
                    toucher visuellement l'étiquette km, positionnée juste au-dessus. */}
                <line
                  x1={toX(km)} y1={0} x2={toX(km)} y2={baseY}
                  stroke={color}
                  strokeDasharray="2,3"
                  strokeWidth={isActive ? 2.5 : isHovered ? 1.5 : 0.75}
                  opacity={isHovered ? 0.95 : 0.5}
                />
                {/* Zone de tap invisible élargie en mobile — le point visible (r=5-8) est une
                    cible tactile bien trop petite pour être fiable au doigt. */}
                {isMobile && (
                  <circle
                    cx={toX(km)} cy={toY(altAtKm(km))} r={20}
                    fill="transparent"
                    style={{ pointerEvents: 'all' }}
                  />
                )}
                <circle
                  cx={toX(km)} cy={toY(altAtKm(km))} r={isActive ? 8 : isHovered ? 7 : 5}
                  fill={isHovered ? 'var(--color-secondary-500)' : p.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR}
                  stroke={p.isRavito ? undefined : '#fff'}
                  strokeWidth={p.isRavito ? undefined : 1.5}
                />
              </g>
            )
          })}

          {/* Tooltip vertical line (scrub) */}
          {displayHoverKm != null && !activePointTooltip && (
            <line
              x1={hoverDotPx!} y1={MT} x2={hoverDotPx!} y2={baseY}
              stroke="var(--color-primary-500)"
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.6}
            />
          )}

          {/* Point de survol — gris, jaune si un point est en cours d'ajout */}
          {displayHoverKm != null && !activePointTooltip && (
            <circle
              cx={hoverDotPx!} cy={hoverDotPy!} r={isPendingHover ? 7 : 5}
              fill={isPendingHover ? 'var(--color-secondary-500)' : '#8a9098'}
              stroke="#fff"
              strokeWidth={1.5}
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
                textAnchor={km === distTicks[distTicks.length - 1] ? 'end' : km === distTicks[0] ? 'start' : 'middle'}
                fontSize={8}
                fill="var(--color-neutral-500)"
              >
                {km === 0 ? '0' : `${km}${km === distTicks[distTicks.length - 1] ? ' km' : ''}`}
              </text>
            </g>
          ))}
        </svg>

      </div>

      {/* Tooltip flottante — suit le curseur en x, ancrée en haut du composant tout entier (donc
          au-dessus des étiquettes km, y compris la version pivotée à 90° en mobile qui remonte
          bien plus haut que sa rangée). Point existant (même format que sur la carte : pastille +
          tag km, puis passage/temps écoulé) ou survol générique du terrain (pente/allure/écoulé/
          heure). Masquée dès qu'une popup de clic (ajout ou menu de point existant) est ouverte,
          qui prend le relais visuellement. */}
      {(activePointTooltip || displayStats) && pendingKm == null && activePointId == null && (
        <div
          className="pointer-events-none absolute top-0 z-[2000] -translate-x-1/2 whitespace-nowrap rounded-xl border border-neutral-20 bg-white/95 px-150 py-100 text-[10px] shadow-lg backdrop-blur-sm"
          style={{ left: `${((activePointTooltip?.px ?? hoverDotPx ?? 0) / VW) * 100}%` }}
        >
          {activePointTooltip ? (
            <>
              <div className="flex items-center justify-between gap-75">
                <div className="flex items-center gap-75">
                  <span
                    className="size-100 shrink-0 rounded-full"
                    style={{ background: activePointTooltip.point.isRavito ? RAVITO_COLOR : WAYPOINT_COLOR }}
                  />
                  <p className="text-[11px] font-bold text-neutral-800">{activePointTooltip.point.label}</p>
                </div>
                <ColorTag color="primary" label={`${activePointTooltip.stats.km} km`} />
              </div>
              <div className="mt-50 flex flex-col gap-25">
                <TooltipRow label="Passage à" value={activePointTooltip.stats.timeLabel} />
                <TooltipRow label="Temps écoulé" value={activePointTooltip.stats.elapsedLabel} />
              </div>
            </>
          ) : displayStats && (
            <>
              <p className="text-[11px] font-bold text-neutral-800">{displayStats.km} km</p>
              <div className="mt-50 flex flex-col gap-25">
                <TooltipRow label="Pente" value={`${slopeAtKm(displayStats.km).toFixed(1)}%`} color={getSlopeColor(slopeAtKm(displayStats.km))} />
                <TooltipRow label="Allure" value={displayStats.paceLabel} />
                <TooltipRow label="Temps écoulé" value={displayStats.elapsedLabel} />
                <TooltipRow label="Heure" value={displayStats.timeLabel} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Scrollbar horizontale — uniquement visible quand zoomé, pour se déplacer dans la vue.
          Flèches aux extrémités + piste/curseur, comme une scrollbar système standard. */}
      {isZoomed && (
        <div className="mt-100 flex items-center gap-75">
          <button
            type="button"
            aria-label="Défiler vers la gauche"
            onClick={() => panBy(-0.2)}
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-neutral-20 bg-white text-neutral-600 shadow-widget transition-colors hover:bg-neutral-10"
          >
            <ChevronLeft className="size-3" strokeWidth={2.5} />
          </button>
          <div
            ref={scrollbarTrackRef}
            onMouseDown={handleScrollbarTrackMouseDown}
            className="relative h-75 flex-1 cursor-pointer rounded-full bg-neutral-20"
          >
            <div
              onMouseDown={handleScrollbarThumbMouseDown}
              className="absolute top-0 h-75 min-w-[24px] cursor-grab rounded-full bg-neutral-400 transition-colors hover:bg-neutral-500 active:cursor-grabbing"
              style={{
                left: `${(view.start / maxKmFull) * 100}%`,
                width: `${(viewSpan / maxKmFull) * 100}%`,
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Défiler vers la droite"
            onClick={() => panBy(0.2)}
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-neutral-20 bg-white text-neutral-600 shadow-widget transition-colors hover:bg-neutral-10"
          >
            <ChevronRight className="size-3" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-100 space-y-50">
          <SlopeLegend />
        </div>
      )}
    </div>
  )
}
