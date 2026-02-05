import { Timeline } from '../visualizer/Timeline'
import { Oscilloscope } from '../visualizer/Oscilloscope'
import type { ScheduledEvent } from '../audio/types'

interface VisualizerPanelProps {
  events: ScheduledEvent[]
  transportSeconds: number
  bpm: number
  waveformRef?: React.RefObject<{ getValue(): Float32Array } | null>
  onEventsChange?: (events: ScheduledEvent[]) => void
  onMute?: (lane: string) => void
  onClear?: (lane: string) => void
  mutedLanes?: Set<string>
}

export function VisualizerPanel({
  events,
  transportSeconds,
  bpm,
  waveformRef,
  onEventsChange,
  onMute,
  onClear,
  mutedLanes,
}: VisualizerPanelProps) {
  return (
    <div className="visualizer-panel">
      <Timeline
        events={events}
        transportSeconds={transportSeconds}
        bpm={bpm}
        onEventsChange={onEventsChange}
        onMute={onMute}
        onClear={onClear}
        mutedLanes={mutedLanes}
      />
      <Oscilloscope waveformRef={waveformRef} />
    </div>
  )
}
