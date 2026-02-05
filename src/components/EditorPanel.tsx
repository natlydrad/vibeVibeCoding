import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { LineChange } from '../diff/useCodeDiff'
import { getChangeDecorations } from '../diff/onionSkin'

interface EditorPanelProps {
  code: string
  onChange: (value: string) => void
  decorations?: LineChange[]
  showGhost: boolean
  ghostCode: string | null
  onGhostToggle: () => void
}

export function EditorPanel({
  code,
  onChange,
  decorations = [],
  showGhost,
  ghostCode,
  onGhostToggle,
}: EditorPanelProps) {
  const editorRef = useRef<Parameters<NonNullable<Parameters<typeof Editor>[0]['onMount']>>[0] | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationIdsRef = useRef<string[]>([])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const newDecos = getChangeDecorations(decorations, monaco)
    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, newDecos)
  }, [decorations])

  return (
    <div className="editor-panel">
      <div className="editor-toolbar">
        <button type="button" className="ghost-toggle" onClick={onGhostToggle} title="Toggle ghost previous">
          {showGhost ? 'Hide ghost' : 'Show ghost'}
        </button>
      </div>
      <div className="editor-container">
        {showGhost && ghostCode != null && (
          <div className="editor-ghost">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              value={ghostCode}
              options={{
                readOnly: true,
                domReadOnly: true,
                renderLineHighlight: 'none',
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
              theme="vs-dark"
            />
          </div>
        )}
        <div className="editor-main">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            onChange={(v) => onChange(v ?? '')}
            onMount={(editor, monaco) => {
              editorRef.current = editor
              monacoRef.current = monaco ?? null
            }}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: true,
            }}
            theme="vs-dark"
          />
        </div>
      </div>
    </div>
  )
}
