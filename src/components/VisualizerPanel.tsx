import { Timeline } from '../visualizer/Timeline'
import { Oscilloscope } from '../visualizer/Oscilloscope'
import type { ScheduledEvent } from '../audio/types'

interface VisualizerPanelProps {
  events: ScheduledEvent[]
  transportSeconds: number
  bpm: number
  waveformRef?: React.RefObject<{ getValue(): Float32Array } | null>
}

export function VisualizerPanel({ events, transportSeconds, bpm, waveformRef }: VisualizerPanelProps) {
  return (
    <div className="visualizer-panel">
      <Timeline events={events} transportSeconds={transportSeconds} bpm={bpm} />
      <Oscilloscope waveformRef={waveformRef} />
    </div>
  )
}
