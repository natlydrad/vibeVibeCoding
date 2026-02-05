import { Timeline } from '../visualizer/Timeline'
import { Oscilloscope } from '../visualizer/Oscilloscope'
import type { ScheduledEvent } from '../audio/types'

interface VisualizerPanelProps {
  events: ScheduledEvent[]
  transportSeconds: number
  bpm: number
  waveformRef?: React.RefObject<{ getValue(): Float32Array } | null>
  onEventsChange?: (events: ScheduledEvent[]) => void
}

export function VisualizerPanel({ events, transportSeconds, bpm, waveformRef, onEventsChange }: VisualizerPanelProps) {
  return (
    <div className="visualizer-panel">
      <Timeline
        events={events}
        transportSeconds={transportSeconds}
        bpm={bpm}
        onEventsChange={onEventsChange}
      />
      <Oscilloscope waveformRef={waveformRef} />
    </div>
  )
}
