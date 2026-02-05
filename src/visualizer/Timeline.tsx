import { useRef, useCallback, useState, useEffect } from 'react'
import type { ScheduledEvent } from '../audio/types'

const SNAP_BEAT = 0.25

interface TimelineProps {
  events: ScheduledEvent[]
  transportSeconds: number
  bpm: number
  onEventsChange?: (events: ScheduledEvent[]) => void
  onMute?: (lane: string) => void
  onClear?: (lane: string) => void
  mutedLanes?: Set<string>
}

const LANES = ['kick', 'snare', 'hats', 'bass']
const LANE_COLORS: Record<string, string> = {
  kick: '#e74c3c',
  snare: '#3498db',
  hats: '#2ecc71',
  bass: '#9b59b6',
}
const BEATS_PER_BAR = 4
const BARS = 4

const DEFAULT_EVENT: Record<string, { duration: number; label: string }> = {
  kick: { duration: 0.25, label: 'Kick' },
  snare: { duration: 0.25, label: 'Snare' },
  hats: { duration: 0.125, label: 'Hat' },
  bass: { duration: 0.5, label: 'C2' },
}

function snap(time: number): number {
  return Math.round(time / SNAP_BEAT) * SNAP_BEAT
}

export function Timeline({
  events,
  transportSeconds,
  bpm,
  onEventsChange,
  onMute,
  onClear,
  mutedLanes = new Set(),
}: TimelineProps) {
  const totalBeats = BEATS_PER_BAR * BARS
  const secondsPerBeat = 60 / bpm
  const totalSeconds = totalBeats * secondsPerBeat
  const gridWrapRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<{ index: number; startTime: number; startX: number } | null>(null)

  const playheadPosition = totalSeconds > 0
    ? Math.min(1, (transportSeconds % totalSeconds) / totalSeconds)
    : 0

  const editable = Boolean(onEventsChange)

  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, event: ScheduledEvent) => {
      if (!editable) return
      e.preventDefault()
      const index = events.indexOf(event)
      if (index < 0) return
      setDragging({ index, startTime: event.time, startX: e.clientX })
    },
    [editable, events]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging || !onEventsChange || !gridWrapRef.current) return
      const rect = gridWrapRef.current.getBoundingClientRect()
      const width = rect.width
      if (width <= 0) return
      const ev = events[dragging.index]
      if (!ev) return
      const deltaBeats = ((e.clientX - dragging.startX) / width) * totalBeats
      let newTime = snap(dragging.startTime + deltaBeats)
      newTime = Math.max(0, Math.min(totalBeats - ev.duration, newTime))
      const next = events.slice()
      next[dragging.index] = { ...ev, time: newTime }
      onEventsChange(next)
      setDragging((d) => (d ? { ...d, startTime: newTime, startX: e.clientX } : null))
    },
    [dragging, events, onEventsChange, totalBeats]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleBlockDoubleClick = useCallback(
    (e: React.MouseEvent, event: ScheduledEvent) => {
      if (!editable || !onEventsChange) return
      e.preventDefault()
      e.stopPropagation()
      const index = events.indexOf(event)
      if (index < 0) return
      const next = events.filter((_, i) => i !== index)
      onEventsChange(next)
    },
    [editable, events, onEventsChange]
  )

  const handleLaneDoubleClick = useCallback(
    (e: React.MouseEvent, lane: string) => {
      if (!editable || !onEventsChange || !gridWrapRef.current) return
      const rect = gridWrapRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      if (width <= 0 || x < 0 || x > width) return
      const time = snap((x / width) * totalBeats)
      const timeClamped = Math.max(0, Math.min(totalBeats - SNAP_BEAT, time))
      const def = DEFAULT_EVENT[lane] ?? { duration: 0.25, label: lane }
      const newEvent: ScheduledEvent = {
        time: timeClamped,
        duration: def.duration,
        label: def.label,
        lane,
      }
      onEventsChange([...events, newEvent])
    },
    [editable, events, onEventsChange, totalBeats]
  )

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, handlePointerMove, handlePointerUp])

  return (
    <div className="timeline">
      <div className="timeline-header">
        <div className="timeline-labels">
          {LANES.map((lane) => (
            <div
              key={lane}
              className="timeline-lane-label"
              style={{ borderColor: LANE_COLORS[lane] ?? '#666' }}
            >
              <span className="timeline-lane-name">{lane}</span>
              {editable && (
                <span className="timeline-lane-actions">
                  <button
                    type="button"
                    className={`timeline-lane-btn timeline-lane-mute ${mutedLanes.has(lane) ? 'timeline-lane-mute-on' : ''}`}
                    onClick={() => onMute?.(lane)}
                    title={mutedLanes.has(lane) ? 'Unmute channel' : 'Mute channel'}
                    aria-pressed={mutedLanes.has(lane)}
                    aria-label={mutedLanes.has(lane) ? 'Unmute channel' : 'Mute channel'}
                  >
                    {mutedLanes.has(lane) ? (
                      <svg className="timeline-mute-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                        <path fill="currentColor" d="M3 5h2v6H3V5zm4-1v8l5-4-5-4z" />
                        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M2 2l12 12" />
                      </svg>
                    ) : (
                      <svg className="timeline-mute-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                        <path fill="currentColor" d="M3 5h2v6H3V5zm4-1v8l5-4-5-4z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className="timeline-lane-btn timeline-lane-clear"
                    onClick={() => onClear?.(lane)}
                    title="Clear all events in this lane"
                  >
                    Clear
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="timeline-ruler">
        {Array.from({ length: BARS }, (_, i) => (
          <div
            key={i}
            className="timeline-ruler-label"
            style={{ left: `${(i / BARS) * 100}%` }}
          >
            Bar {i + 1}
          </div>
        ))}
      </div>
      <div className="timeline-grid-wrap" ref={gridWrapRef}>
        <div
          className="timeline-playhead"
          style={{ left: `${playheadPosition * 100}%` }}
          title="Playhead (current playback position). Vertical lines are beat boundaries."
        />
        <div className="timeline-grid">
          {Array.from({ length: BARS * BEATS_PER_BAR + 1 }, (_, i) => (
            <div
              key={i}
              className="timeline-grid-line"
              style={{ left: `${(i / (BARS * BEATS_PER_BAR)) * 100}%` }}
            />
          ))}
        </div>
        <div className="timeline-lanes">
          {LANES.map((lane) => (
            <div
              key={lane}
              className={`timeline-lane ${editable ? 'timeline-lane-editable' : ''}`}
              title={editable ? 'Double-click empty space to add' : undefined}
              onDoubleClick={(e) => handleLaneDoubleClick(e, lane)}
            >
              {events
                .filter((e) => e.lane === lane)
                .map((e, i) => {
                  const startPct = (e.time / totalBeats) * 100
                  const widthPct = Math.max(2, (e.duration / totalBeats) * 100)
                  return (
                    <div
                      key={`${lane}-${i}-${e.time}`}
                      className={`timeline-block ${editable ? 'timeline-block-draggable' : ''}`}
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: LANE_COLORS[lane] ?? '#666',
                      }}
                      title={editable ? `${e.label} — drag to move, double-click to remove` : e.label}
                      onPointerDown={(ev) => handleBlockMouseDown(ev, e)}
                      onDoubleClick={(ev) => handleBlockDoubleClick(ev, e)}
                    />
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
