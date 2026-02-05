export interface ChangeHunk {
  type: 'add' | 'remove' | 'modify'
  startLine: number
  endLine: number
}

interface ChangeMarkersPanelProps {
  hunks: ChangeHunk[]
}

export function ChangeMarkersPanel({ hunks }: ChangeMarkersPanelProps) {
  if (hunks.length === 0) {
    return (
      <div className="change-markers-panel">
        <div className="change-markers-title">Change markers</div>
        <div className="change-markers-empty">No changes</div>
      </div>
    )
  }
  return (
    <div className="change-markers-panel">
      <div className="change-markers-title">Change markers</div>
      <ul className="change-markers-list">
        {hunks.map((h, i) => (
          <li key={i} className={`change-marker ${h.type}`}>
            Lines {h.startLine}–{h.endLine} ({h.type})
          </li>
        ))}
      </ul>
    </div>
  )
}
