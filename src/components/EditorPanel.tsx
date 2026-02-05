import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { LineChange } from '../diff/useCodeDiff'
import { getChangeDecorations } from '../diff/onionSkin'

type MonacoEditor = Parameters<NonNullable<Parameters<typeof Editor>[0]['onMount']>>[0]

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
  const editorRef = useRef<MonacoEditor | null>(null)
  const ghostEditorRef = useRef<MonacoEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationIdsRef = useRef<string[]>([])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const newDecos = getChangeDecorations(decorations, monaco)
    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, newDecos)
  }, [decorations])

  useEffect(() => {
    if (!showGhost) ghostEditorRef.current = null
  }, [showGhost])

  // Sync main editor scroll to ghost editor
  useEffect(() => {
    const main = editorRef.current
    const ghost = ghostEditorRef.current
    if (!main || !ghost || !showGhost) return
    const syncScroll = () => {
      ghost.setScrollTop(main.getScrollTop())
      ghost.setScrollLeft(main.getScrollLeft())
    }
    syncScroll()
    const disposable = main.onDidScrollChange(syncScroll)
    return () => disposable.dispose()
  }, [showGhost, ghostCode])

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
              onMount={(editor) => {
                ghostEditorRef.current = editor
                const main = editorRef.current
                if (main) {
                  editor.setScrollTop(main.getScrollTop())
                  editor.setScrollLeft(main.getScrollLeft())
                }
              }}
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
              // Patch code runs in sandbox with Tone injected; add ambient decl so Monaco doesn't show red
              monaco?.languages.typescript.typescriptDefaults.addExtraLib(
                '/** Tone.js - injected at runtime by the patch evaluator */\ndeclare const Tone: any;',
                'ts:patch-globals.d.ts'
              )
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
