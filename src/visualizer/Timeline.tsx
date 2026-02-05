import type { ScheduledEvent } from '../audio/types'

interface TimelineProps {
  events: ScheduledEvent[]
  transportSeconds: number
  bpm: number
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

export function Timeline({ events, transportSeconds, bpm }: TimelineProps) {
  const totalBeats = BEATS_PER_BAR * BARS
  const secondsPerBeat = 60 / bpm
  const totalSeconds = totalBeats * secondsPerBeat

  const playheadPosition = totalSeconds > 0
    ? Math.min(1, (transportSeconds % totalSeconds) / totalSeconds)
    : 0

  return (
    <div className="timeline">
      <div className="timeline-header">
        <div className="timeline-labels">
          {LANES.map((lane) => (
            <div key={lane} className="timeline-lane-label" style={{ borderColor: LANE_COLORS[lane] ?? '#666' }}>
              {lane}
            </div>
          ))}
        </div>
      </div>
      <div className="timeline-grid-wrap">
        <div
          className="timeline-playhead"
          style={{ left: `${playheadPosition * 100}%` }}
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
            <div key={lane} className="timeline-lane">
              {events
                .filter((e) => e.lane === lane)
                .map((e, i) => {
                  const startPct = (e.time / totalBeats) * 100
                  const widthPct = Math.max(2, (e.duration / totalBeats) * 100)
                  return (
                    <div
                      key={`${lane}-${i}`}
                      className="timeline-block"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: LANE_COLORS[lane] ?? '#666',
                      }}
                      title={e.label}
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
