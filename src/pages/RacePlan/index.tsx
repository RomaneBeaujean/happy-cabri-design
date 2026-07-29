import { useMemo, useState, Fragment } from 'react'
import {
  ChevronLeft, ChevronDown, TrendingUp, TrendingDown, Link2,
  MapPin, Calendar, Route, Pencil, Check, Layers,
  Rows2, Columns2,
} from 'lucide-react'
import AppLayout from '../../layouts/AppLayout'
import SlopeAltimetryChart, { type ChartPoint } from '../../components/SlopeAltimetryChart'
import RouteMap, { type MapSegment } from '../../components/RouteMap'
import ColorTag from '../../components/ColorTag'
import SegmentCard from './SegmentCard'
import SegmentSeparator from './SegmentSeparator'
import RedefineSegmentsModal from './RedefineSegmentsModal'
import AddPointPopup from './AddPointPopup'
import { ALT_DATA, TRACK } from './mockData'
import { buildInitialData } from './mockData'
import {
  deriveSegments, moveCutPoint, rebuildCutPoints, pruneRecordByIds, insertCutPoint,
  type CutPoint, type SegmentData, type SegmentNutrition,
} from './segmentModel'
import { fmtTime, fmtPassage, parseTimeToMins, fmtDateFr } from './format'

const INITIAL = buildInitialData()

// ── Helpers ────────────────────────────────────────────────────────────────────
function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RacePlan() {
  const [globalEdit, setGlobalEdit] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(true)
  const [sideBySide, setSideBySide] = useState(false)

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

  const [redefineOpen, setRedefineOpen] = useState(false)

  function handleApplyRedefine(newKms: number[]) {
    const totalKm = cutPoints.length > 0 ? Math.max(...cutPoints.map(c => c.km)) : 0
    const result = rebuildCutPoints(cutPoints, segmentData, [0, ...newKms, totalKm])
    const survivingIds = new Set(result.cutPoints.map(c => c.id))
    setCutPoints(result.cutPoints)
    setSegmentData(result.segmentData)
    setRavitoIds(prev => new Set([...prev].filter(id => survivingIds.has(id))))
    setRavitoStops(prev => pruneRecordByIds(prev, survivingIds))
    setCutoffTimes(prev => pruneRecordByIds(prev, survivingIds))
    setRedefineOpen(false)
  }

  const [headerGlobalEdit, setHeaderGlobalEdit] = useState(false)
  const [localTitle,    setLocalTitle]    = useState('Luchon Aneto Trail 2025')
  const [localLocation, setLocalLocation] = useState('Luchon')
  const [localDate,     setLocalDate]     = useState('2025-11-13')
  const [localTime,     setLocalTime]     = useState('04:00')

  const segments = useMemo(() => deriveSegments(cutPoints, segmentData, ALT_DATA), [cutPoints, segmentData])
  const interiorKms = useMemo(() => {
    const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
    return sorted.slice(1, -1).map(c => c.km)
  }, [cutPoints])

  const chartPoints: ChartPoint[] = useMemo(() => {
    const sorted = [...cutPoints].sort((a, b) => a.km - b.km)
    return sorted.slice(1, -1).map(c => ({ id: c.id, km: c.km, isRavito: ravitoIds.has(c.id) }))
  }, [cutPoints, ravitoIds])

  const mapSegments: MapSegment[] = useMemo(
    () => segments.map(seg => ({ from: seg.from, to: seg.to, isClimb: seg.dp >= seg.dm })),
    [segments]
  )

  const totalKm = segments.length > 0 ? segments[segments.length - 1].to : 0
  const totalDp = segments.reduce((sum, s) => sum + s.dp, 0)
  const totalDm = segments.reduce((sum, s) => sum + s.dm, 0)

  const startMins = parseTimeToMins(localTime)
  const cumuls = segments.reduce<number[]>((acc, seg, i) => {
    acc.push((acc[i - 1] ?? 0) + seg.timeMins)
    return acc
  }, [])

  const typeLabels = (() => {
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
            <ColorTag color="secondary" icon={<Route        className="size-3" strokeWidth={2} />} label={`${totalKm} km`} />
            <ColorTag color="orange"    icon={<TrendingUp   className="size-3" strokeWidth={2} />} label={`+${totalDp.toLocaleString('fr')} m`} />
            <ColorTag color="green"     icon={<TrendingDown className="size-3" strokeWidth={2} />} label={`−${totalDm.toLocaleString('fr')} m`} />
          </div>
        </section>

        {/* ── Profil et carte ── */}
        <div
          className={`widget-card px-300 py-300${
            sideBySide && profileExpanded
              ? ' lg:relative lg:left-1/2 lg:w-[calc(100vw-16px)] lg:max-w-none lg:-translate-x-1/2'
              : ''
          }`}
        >
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
              <SlopeAltimetryChart
                data={ALT_DATA}
                height={sideBySide ? 260 : 200}
                points={chartPoints}
                distanceStep={20}
                onAddPoint={handleAddPointRequest}
              />
              <div className="overflow-hidden rounded-2xl">
                <RouteMap
                  height={sideBySide ? 296 : 320}
                  track={TRACK}
                  segments={mapSegments}
                  points={chartPoints}
                  onAddPoint={handleAddPointRequest}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Segments ── */}
        <section className="space-y-150">
          <div className="flex items-center justify-between gap-100">
            <h2 className="font-accent text-[18px] font-extrabold text-neutral-800">Segments</h2>
            <div className="flex shrink-0 items-center gap-100">
              {globalEdit ? (
                <button className="btn btn-primary" onClick={() => setGlobalEdit(false)}>
                  <Check className="size-4" strokeWidth={2.5} />
                  Enregistrer
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => setGlobalEdit(true)}>
                  <Pencil className="size-4" strokeWidth={2} />
                  Édition multiple
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setRedefineOpen(true)}>
                <Layers className="size-4" strokeWidth={2} />
                Redéfinir les segments
              </button>
            </div>
          </div>

          <div className="relative space-y-100">
            {/* Rail vertical continu — collé au bord gauche, à tous les breakpoints */}
            <div className="pointer-events-none absolute bottom-0 left-100 top-0 w-px -translate-x-1/2 bg-neutral-60" />

            {segments.map((seg, i) => (
              <Fragment key={seg.id}>
                <SegmentCard
                  seg={seg}
                  index={i}
                  typeLabel={typeLabels[i]}
                  globalEdit={globalEdit}
                  onPaceChange={(pace, timeMins) => updateSegmentPace(seg.id, pace, timeMins)}
                  onNutritionChange={nutrition => updateSegmentNutrition(seg.id, nutrition)}
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

      {redefineOpen && (
        <RedefineSegmentsModal
          totalKm={totalKm}
          initialKms={interiorKms}
          altData={ALT_DATA}
          onApply={handleApplyRedefine}
          onClose={() => setRedefineOpen(false)}
        />
      )}

      {pendingPoint && (
        <AddPointPopup
          x={pendingPoint.x}
          y={pendingPoint.y}
          km={pendingPoint.km}
          onChoose={handleChoosePoint}
          onClose={() => setPendingPoint(null)}
        />
      )}
    </AppLayout>
  )
}
