import { useMemo, useState, Fragment } from 'react'
import {
  ChevronLeft, ChevronDown, TrendingUp, TrendingDown, Link2,
  MapPin, Calendar, Route, Pencil, Check, Plus,
} from 'lucide-react'
import AppLayout from '../../layouts/AppLayout'
import SlopeAltimetryChart, { type ChartPoint, type HoverSegment } from '../../components/SlopeAltimetryChart'
import RouteMap, { type MapSegment } from '../../components/RouteMap'
import ColorTag from '../../components/ColorTag'
import SegmentCard from './SegmentCard'
import SegmentSeparator from './SegmentSeparator'
import AddPointPopup from './AddPointPopup'
import ExistingPointMenu from './ExistingPointMenu'
import AddCoursePointModal from './AddCoursePointModal'
import { ALT_DATA, TRACK } from './mockData'
import { buildInitialData } from './mockData'
import {
  deriveSegments, moveCutPoint, insertCutPoint, removeCutPoint,
  type CutPoint, type SegmentData, type SegmentNutrition,
} from './segmentModel'
import { makeStatsAtKm, makePointLabels } from './trackStats'
import { fmtTime, fmtPassage, parseTimeToMins, fmtDateFr } from './format'
import { useIsMobile } from '../../hooks/useIsMobile'

const INITIAL = buildInitialData()

// ── Helpers ────────────────────────────────────────────────────────────────────
function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RacePlan() {
  const isMobile = useIsMobile()
  const [globalEdit, setGlobalEdit] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(true)

  const [cutPoints, setCutPoints] = useState<CutPoint[]>(INITIAL.cutPoints)
  const [segmentData, setSegmentData] = useState<Record<string, SegmentData>>(INITIAL.segmentData)
  const [ravitoIds, setRavitoIds] = useState<Set<string>>(INITIAL.ravitoIds)
  const [ravitoStops, setRavitoStops] = useState<Record<string, string>>(INITIAL.ravitoStops)
  const [cutoffTimes, setCutoffTimes] = useState<Record<string, string>>(INITIAL.cutoffTimes)

  function addRavito(id: string, mins: string) {
    setRavitoIds(prev => new Set(prev).add(id))
    setRavitoStops(prev => ({ ...prev, [id]: mins }))
  }
  function removeRavito(id: string) {
    setRavitoIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setRavitoStops(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  function setRavitoStop(id: string, mins: string) {
    setRavitoStops(prev => ({ ...prev, [id]: mins }))
  }
  function addCutoff(id: string, time: string) {
    setCutoffTimes(prev => ({ ...prev, [id]: time }))
  }
  function removeCutoff(id: string) {
    setCutoffTimes(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  function setCutoffTime(id: string, time: string) {
    setCutoffTimes(prev => ({ ...prev, [id]: time }))
  }

  function updateSegmentPace(id: string, pace: string, timeMins: number) {
    setSegmentData(prev => ({ ...prev, [id]: { ...prev[id], pace, timeMins } }))
  }
  function updateSegmentNutrition(id: string, nutrition: SegmentNutrition) {
    setSegmentData(prev => ({ ...prev, [id]: { ...prev[id], nutrition } }))
  }

  function handleKmChange(id: string, newKm: number) {
    setCutPoints(prev => moveCutPoint(prev, id, newKm))
  }

  function handleDeleteSegment(id: string, idx: number) {
    if (segments.length <= 1) return
    if (idx < segments.length - 1) {
      // Cas général : le segment fusionne dans le suivant, qui garde sa propre allure.
      const result = removeCutPoint(cutPoints, segmentData, id)
      setCutPoints(result.cutPoints)
      setSegmentData(result.segmentData)
      removeRavito(id)
      removeCutoff(id)
    } else {
      // Dernier segment : sa borne de fin (arrivée) est protégée, on retire donc sa borne de
      // départ et le segment précédent absorbe la distance en gardant sa propre allure.
      const prevId = segments[idx - 1].id
      const prevData = segmentData[prevId]
      const result = removeCutPoint(cutPoints, segmentData, prevId)
      setCutPoints(result.cutPoints)
      setSegmentData(prevData
        ? { ...result.segmentData, [id]: { ...result.segmentData[id], pace: prevData.pace } }
        : result.segmentData)
      removeRavito(prevId)
      removeCutoff(prevId)
    }
  }

  const [showAddPointModal, setShowAddPointModal] = useState(false)

  function handleAddCoursePoint(
    km: number,
    ravito: { enabled: boolean; mins: string },
    cutoff: { enabled: boolean; time: string }
  ) {
    const result = insertCutPoint(cutPoints, segmentData, km)
    setCutPoints(result.cutPoints)
    setSegmentData(result.segmentData)
    if (ravito.enabled) addRavito(result.newId, ravito.mins)
    if (cutoff.enabled) addCutoff(result.newId, cutoff.time)
    setShowAddPointModal(false)
  }

  const [pendingPoint, setPendingPoint] = useState<{ km: number; x: number; y: number } | null>(null)

  function handleAddPointRequest(km: number, x: number, y: number) {
    setPendingPoint({ km, x, y })
  }

  function handleChoosePoint(kind: 'separator' | 'ravito') {
    if (!pendingPoint) return
    const result = insertCutPoint(cutPoints, segmentData, pendingPoint.km)
    setCutPoints(result.cutPoints)
    setSegmentData(result.segmentData)
    if (kind === 'ravito') addRavito(result.newId, '3')
    setPendingPoint(null)
  }

  const [pendingExistingPoint, setPendingExistingPoint] = useState<{ id: string; km: number; x: number; y: number } | null>(null)

  function handlePointClick(id: string, x: number, y: number) {
    const cp = cutPoints.find(c => c.id === id)
    if (!cp) return
    setPendingExistingPoint({ id, km: cp.km, x, y })
  }

  function handleConvertPoint() {
    if (!pendingExistingPoint) return
    const { id } = pendingExistingPoint
    if (ravitoIds.has(id)) removeRavito(id)
    else addRavito(id, '3')
    setPendingExistingPoint(null)
  }

  function handleDeletePoint() {
    if (!pendingExistingPoint) return
    const { id } = pendingExistingPoint
    const result = removeCutPoint(cutPoints, segmentData, id)
    setCutPoints(result.cutPoints)
    setSegmentData(result.segmentData)
    removeRavito(id)
    removeCutoff(id)
    setPendingExistingPoint(null)
  }

  // Un scroll (zoom/pan du profil) invalide la position figée des popups de clic — on les ferme.
  function closePointPopups() {
    setPendingPoint(null)
    setPendingExistingPoint(null)
  }

  const [hoverKm, setHoverKm] = useState<number | null>(null)
  // Tooltip épinglée en mobile (lecture seule) — partagée entre la carte et le profil pour
  // qu'un tap dans une vue ferme/synchronise la tooltip de l'autre.
  const [pinnedPointId, setPinnedPointId] = useState<string | null>(null)

  const [headerGlobalEdit, setHeaderGlobalEdit] = useState(false)
  const [localTitle,    setLocalTitle]    = useState('Luchon Aneto Trail 2025')
  const [localLocation, setLocalLocation] = useState('Luchon')
  const [localDate,     setLocalDate]     = useState('2025-11-13')
  const [localTime,     setLocalTime]     = useState('04:00')

  const segments = useMemo(() => deriveSegments(cutPoints, segmentData, ALT_DATA), [cutPoints, segmentData])

  const totalKm = segments.length > 0 ? segments[segments.length - 1].to : 0
  const totalDp = segments.reduce((sum, s) => sum + s.dp, 0)
  const totalDm = segments.reduce((sum, s) => sum + s.dm, 0)

  const startMins = parseTimeToMins(localTime)
  const cumuls = segments.reduce<number[]>((acc, seg, i) => {
    acc.push((acc[i - 1] ?? 0) + seg.timeMins)
    return acc
  }, [])
  const cumulDp = segments.reduce<number[]>((acc, seg, i) => {
    acc.push((acc[i - 1] ?? 0) + seg.dp)
    return acc
  }, [])
  const cumulDm = segments.reduce<number[]>((acc, seg, i) => {
    acc.push((acc[i - 1] ?? 0) + seg.dm)
    return acc
  }, [])

  const typeLabels = useMemo(() => {
    const counts = { montée: 0, descente: 0, plat: 0 }
    return segments.map(seg => {
      const t = seg.dp > seg.dm ? 'montée' as const
               : seg.dm > seg.dp ? 'descente' as const
               : 'plat' as const
      counts[t]++
      return t === 'montée'   ? `Montée ${counts.montée}`
           : t === 'descente' ? `Descente ${counts.descente}`
           : `Plat ${counts.plat}`
    })
  }, [segments])

  // Stats (heure, temps écoulé, D+/D-, allure) à un km donné — partagées par le profil et la carte
  const getStats = useMemo(() => makeStatsAtKm(segments, ALT_DATA, startMins), [segments, startMins])

  const pointLabels = useMemo(() => makePointLabels(cutPoints, ravitoIds), [cutPoints, ravitoIds])

  const chartPoints: ChartPoint[] = useMemo(() => {
    const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
    return sorted.slice(1, -1).map(c => ({
      id: c.id, km: c.km, isRavito: ravitoIds.has(c.id), label: pointLabels.get(c.id) ?? '',
    }))
  }, [cutPoints, ravitoIds, pointLabels])

  const mapSegments: MapSegment[] = useMemo(
    () => segments.map((seg, i) => ({
      id: seg.id, from: seg.from, to: seg.to, isClimb: seg.dp >= seg.dm,
      label: typeLabels[i], dp: seg.dp, dm: seg.dm, pace: seg.pace,
    })),
    [segments, typeLabels]
  )

  const chartSegments: HoverSegment[] = useMemo(
    () => segments.map((seg, i) => ({
      id: seg.id, from: seg.from, to: seg.to, label: typeLabels[i], dp: seg.dp, dm: seg.dm, timeMins: seg.timeMins, pace: seg.pace,
    })),
    [segments, typeLabels]
  )

  return (
    <AppLayout activeItem="plans" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300 pb-400 lg:max-w-237.5">

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
              className="input w-full py-100 text-[18px] text-neutral-800 lg:text-[22px]"
            />
          ) : (
            <h1 className="text-[36px] lg:text-[48px] font-normal leading-tight text-neutral-800">
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

            <ColorTag color="secondary" icon={<Route        className="size-3" strokeWidth={2} />} label={`${totalKm} km`} />
            <ColorTag color="orange"    icon={<TrendingUp   className="size-3" strokeWidth={2} />} label={`+${totalDp.toLocaleString('fr')} m`} />
            <ColorTag color="green"     icon={<TrendingDown className="size-3" strokeWidth={2} />} label={`−${totalDm.toLocaleString('fr')} m`} />
          </div>
        </section>

        {/* ── Profil et carte ── */}
        <div className="widget-card">
          <div
            className="flex cursor-pointer items-center justify-between gap-100 px-300 py-200"
            onClick={() => setProfileExpanded(v => !v)}
          >
            <p className="widget-title shrink-0">Profil et carte</p>
            <ChevronDown
              className={`size-4 shrink-0 text-neutral-300 transition-transform duration-200${profileExpanded ? ' rotate-180' : ''}`}
              strokeWidth={2}
            />
          </div>
          {profileExpanded && (
            <div className="flex flex-col gap-300 pb-300">
              <RouteMap
                height={isMobile ? 240 : 320}
                track={TRACK}
                segments={mapSegments}
                points={chartPoints}
                getStats={getStats}
                onAddPoint={handleAddPointRequest}
                onPointClick={handlePointClick}
                onPointMove={handleKmChange}
                hoverKm={hoverKm}
                onHoverKmChange={setHoverKm}
                pendingKm={pendingPoint?.km ?? null}
                activePointId={pendingExistingPoint?.id ?? null}
                pinnedPointId={pinnedPointId}
                onPinnedPointChange={setPinnedPointId}
              />
              <SlopeAltimetryChart
                data={ALT_DATA}
                height={isMobile ? 160 : 200}
                points={chartPoints}
                segments={chartSegments}
                distanceStep={20}
                getStats={getStats}
                onAddPoint={handleAddPointRequest}
                onPointClick={handlePointClick}
                onPointMove={handleKmChange}
                hoverKm={hoverKm}
                onHoverKmChange={setHoverKm}
                pendingKm={pendingPoint?.km ?? null}
                activePointId={pendingExistingPoint?.id ?? null}
                pinnedPointId={pinnedPointId}
                onPinnedPointChange={setPinnedPointId}
                onScroll={closePointPopups}
              />
            </div>
          )}
        </div>

        {/* ── Segments ── */}
        <section className="space-y-150">
          <div className="flex items-center justify-between gap-100">
            <h2 className="font-accent text-[18px] font-extrabold text-neutral-800">Segments</h2>
            <div className="flex shrink-0 items-center gap-100">
              <button
                className="btn btn-secondary px-[10px] lg:px-300"
                onClick={() => setShowAddPointModal(true)}
              >
                <Plus className="size-4" strokeWidth={2} />
                <span className="hidden lg:inline">Ajouter un point de parcours</span>
              </button>
              {globalEdit ? (
                <button className="btn btn-primary" onClick={() => setGlobalEdit(false)}>
                  <Check className="size-4" strokeWidth={2.5} />
                  Enregistrer
                </button>
              ) : (
                <button className="btn btn-secondary px-[10px] lg:px-300" onClick={() => setGlobalEdit(true)}>
                  <Pencil className="size-4" strokeWidth={2} />
                  <span className="hidden lg:inline">Édition multiple</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative space-y-100">
            {/* Rail vertical continu — centré, aligné sur le point du SegmentSeparator */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-neutral-60" />

            {segments.map((seg, i) => (
              <Fragment key={seg.id}>
                <SegmentCard
                  seg={seg}
                  index={i}
                  typeLabel={typeLabels[i]}
                  globalEdit={globalEdit}
                  canDelete={segments.length > 1}
                  cumulDp={cumulDp[i]}
                  cumulDm={cumulDm[i]}
                  onPaceChange={(pace, timeMins) => updateSegmentPace(seg.id, pace, timeMins)}
                  onNutritionChange={nutrition => updateSegmentNutrition(seg.id, nutrition)}
                  onDelete={() => handleDeleteSegment(seg.id, i)}
                />
                {i < segments.length - 1 && (
                  <SegmentSeparator
                    km={seg.to}
                    passageLabel={fmtPassage(startMins + cumuls[i])}
                    elapsedLabel={fmtTime(cumuls[i]).replace(' ', '')}
                    isRavito={ravitoIds.has(seg.id)}
                    onAddRavito={mins => addRavito(seg.id, mins)}
                    onRemoveRavito={() => removeRavito(seg.id)}
                    ravitoStop={ravitoStops[seg.id] ?? ''}
                    onRavitoStopChange={mins => setRavitoStop(seg.id, mins)}
                    cutoffTime={cutoffTimes[seg.id]}
                    onAddCutoff={time => addCutoff(seg.id, time)}
                    onRemoveCutoff={() => removeCutoff(seg.id)}
                    onCutoffTimeChange={time => setCutoffTime(seg.id, time)}
                    onKmChange={newKm => handleKmChange(seg.id, newKm)}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </section>

      </div>

      {pendingPoint && (
        <AddPointPopup
          x={pendingPoint.x}
          y={pendingPoint.y}
          km={pendingPoint.km}
          onChoose={handleChoosePoint}
          onClose={() => setPendingPoint(null)}
        />
      )}

      {pendingExistingPoint && (
        <ExistingPointMenu
          x={pendingExistingPoint.x}
          y={pendingExistingPoint.y}
          km={pendingExistingPoint.km}
          label={pointLabels.get(pendingExistingPoint.id) ?? ''}
          isRavito={ravitoIds.has(pendingExistingPoint.id)}
          onConvert={handleConvertPoint}
          onDelete={handleDeletePoint}
          onClose={() => setPendingExistingPoint(null)}
        />
      )}

      {showAddPointModal && (
        <AddCoursePointModal
          totalKm={totalKm}
          onAdd={handleAddCoursePoint}
          onClose={() => setShowAddPointModal(false)}
        />
      )}
    </AppLayout>
  )
}
