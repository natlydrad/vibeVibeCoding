import type { HistoryEntry } from '../App'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
}

function formatHistoryTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function HistoryPanel({ history, onRestore }: HistoryPanelProps) {
  const reversed = [...history].reverse()

  return (
    <div className="history-panel">
      <div className="history-list" role="list">
        {reversed.length === 0 ? (
          <div className="history-empty">No history yet. Apply or Save to create versions.</div>
        ) : (
          reversed.map((entry, i) => (
            <button
              key={`${entry.at}-${i}`}
              type="button"
              className="history-entry"
              onClick={() => onRestore(entry)}
              title="Restore this version into the editor"
            >
              <span className="history-entry-label">{entry.label}</span>
              <span className="history-entry-time">{formatHistoryTime(entry.at)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
