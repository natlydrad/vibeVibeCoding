interface TransportControlsProps {
  bpm: number
  setBpm: (v: number) => void
  volume: number
  setVolume: (v: number) => void
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onApply: () => void
  onRevert: () => void
  error: string | null
}

export function TransportControls({
  bpm,
  setBpm,
  volume,
  setVolume,
  isPlaying: _isPlaying,
  onPlay,
  onStop,
  onApply,
  onRevert,
  error,
}: TransportControlsProps) {
  return (
    <div className="transport-controls">
      <div className="transport-row">
        <button
          type="button"
          className="transport-btn play"
          onClick={onPlay}
          title="Play"
        >
          Play
        </button>
        <button
          type="button"
          className="transport-btn stop"
          onClick={onStop}
          title="Stop"
        >
          Stop
        </button>
        <button type="button" className="transport-btn apply" onClick={onApply} title="Apply Code">
          Apply Code
        </button>
        <button type="button" className="transport-btn revert" onClick={onRevert} title="Revert to last working">
          Revert
        </button>
      </div>
      <div className="transport-row">
        <label className="transport-label">
          BPM
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
          <span className="transport-value">{bpm}</span>
        </label>
        <label className="transport-label">
          Volume
          <input
            type="range"
            min={-24}
            max={6}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span className="transport-value">{volume} dB</span>
        </label>
      </div>
      {error && (
        <div className="transport-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
