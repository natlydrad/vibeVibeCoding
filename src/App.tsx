import { useState, useCallback, useEffect, useRef } from 'react'
import { useAudioEngine, savePersisted } from './audio/useAudioEngine'
import { TransportControls } from './components/TransportControls'
import { VisualizerPanel } from './components/VisualizerPanel'
import { EditorPanel } from './components/EditorPanel'
import { ChatPanel } from './components/ChatPanel'
import { ChangeMarkersPanel } from './components/ChangeMarkersPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { useCodeDiff } from './diff/useCodeDiff'
import { processChatMessageAsync } from './chat/stubAssistant'
import { generatePatchFromEvents } from './audio/generatePatchFromEvents'
import type { ScheduledEvent } from './audio/types'

const HISTORY_STORAGE_KEY = 'vibevibecoding-history'
const HISTORY_CAP = 50

export interface HistoryEntry {
  code: string
  at: string
  label: 'Applied' | 'Saved'
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(-HISTORY_CAP)))
  } catch {
    // ignore
  }
}

function App() {
  const engine = useAudioEngine()
  const [code, setCode] = useState('')
  const [previousCode, setPreviousCode] = useState<string | null>(null)
  const [showGhost, setShowGhost] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const historyWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showHistory) return
    const onPointerDown = (e: PointerEvent) => {
      if (historyWrapRef.current?.contains(e.target as Node)) return
      setShowHistory(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showHistory])

  useEffect(() => {
    const initial = engine.getInitialCode()
    setCode(initial)
    setPreviousCode(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        savePersisted({ patchCode: code, bpm: engine.bpm, volume: engine.volume, lastSavedAt: new Date().toISOString() })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [code, engine.bpm, engine.volume])

  const { decorations, hunks } = useCodeDiff(previousCode, code)

  const handleApply = useCallback(() => {
    const ok = engine.applyCode(code)
    if (ok) {
      setPreviousCode(code)
      const next = [...history, { code, at: new Date().toISOString(), label: 'Applied' as const }].slice(-HISTORY_CAP)
      setHistory(next)
      saveHistory(next)
    }
    engine.setError(null)
  }, [code, engine, history])

  const handleRevert = useCallback(() => {
    const lastGood = engine.revertToLastGood()
    setCode(lastGood)
    setPreviousCode(null)
    engine.setError(null)
  }, [engine])

  const handleSave = useCallback(() => {
    savePersisted({
      patchCode: code,
      bpm: engine.bpm,
      volume: engine.volume,
      lastSavedAt: new Date().toISOString(),
    })
    const next = [...history, { code, at: new Date().toISOString(), label: 'Saved' as const }].slice(-HISTORY_CAP)
    setHistory(next)
    saveHistory(next)
  }, [code, engine.bpm, engine.volume, history])

  const handleExportTs = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patch.ts'
    a.click()
    URL.revokeObjectURL(url)
  }, [code])

  const handleExportJson = useCallback(() => {
    const data = {
      code,
      bpm: engine.bpm,
      volume: engine.volume,
      title: 'vibeVibeCoding patch',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patch.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [code, engine.bpm, engine.volume])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ts,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        let newCode = text
        if (file.name.endsWith('.json')) {
          try {
            const data = JSON.parse(text)
            newCode = data.code ?? text
            if (typeof data.bpm === 'number') engine.setBpm(data.bpm)
            if (typeof data.volume === 'number') engine.setVolume(data.volume)
          } catch {
            newCode = text
          }
        }
        setCode(newCode)
        engine.applyCode(newCode)
        setPreviousCode(newCode)
      }
      reader.readAsText(file)
    }
    input.click()
  }, [engine])

  const handleChatSend = useCallback(
    (text: string) => processChatMessageAsync(text, code, engine.bpm),
    [code, engine.bpm]
  )

  const handleChatApplyEdit = useCallback((result: { code: string; message: string; bpm?: number }) => {
    setCode(result.code)
    if (result.bpm != null) engine.setBpm(result.bpm)
  }, [engine])

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    setCode(entry.code)
    setShowHistory(false)
  }, [])

  const handleTimelineEventsChange = useCallback(
    (newEvents: ScheduledEvent[]) => {
      const newCode = generatePatchFromEvents(newEvents)
      setCode(newCode)
      setPreviousCode(newCode)
      engine.applyCode(newCode)
      engine.setError(null)
    },
    [engine]
  )

  return (
    <div className="app">
      <header className="app-header">
        <span>vibeVibeCoding</span>
        <div className="app-header-actions">
          <div className="history-dropdown-wrap" ref={historyWrapRef}>
            <button
              type="button"
              className="history-toggle"
              onClick={() => setShowHistory((s) => !s)}
              aria-expanded={showHistory}
              aria-haspopup="true"
            >
              History
            </button>
            {showHistory && (
              <div className="history-dropdown" role="dialog" aria-label="Version history">
                <HistoryPanel history={history} onRestore={handleRestoreHistory} />
              </div>
            )}
          </div>
          <button type="button" onClick={handleSave}>Save</button>
          <button type="button" onClick={handleExportTs}>Export .ts</button>
          <button type="button" onClick={handleExportJson}>Export .json</button>
          <button type="button" onClick={handleImport}>Open file</button>
        </div>
      </header>
      <div className="main">
        <div className="left-panel">
          <VisualizerPanel
            events={engine.events}
            transportSeconds={engine.transportSeconds}
            bpm={engine.bpm}
            waveformRef={engine.waveformRef}
            onEventsChange={handleTimelineEventsChange}
          />
        </div>
        <div className="right-panel">
          <div className="right-top">
            <TransportControls
              bpm={engine.bpm}
              setBpm={engine.setBpm}
              volume={engine.volume}
              setVolume={engine.setVolume}
              isPlaying={engine.isPlaying}
              onPlay={engine.play}
              onStop={engine.stop}
              onApply={handleApply}
              onRevert={handleRevert}
              error={engine.error}
            />
            <div className="editor-row">
              <EditorPanel
                code={code}
                onChange={setCode}
                decorations={decorations}
                showGhost={showGhost}
                ghostCode={showGhost ? previousCode : null}
                onGhostToggle={() => setShowGhost((s) => !s)}
              />
              <ChangeMarkersPanel hunks={hunks} />
            </div>
          </div>
          <div className="right-bottom">
            <ChatPanel
              onSend={handleChatSend}
              onApplyEdit={handleChatApplyEdit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
