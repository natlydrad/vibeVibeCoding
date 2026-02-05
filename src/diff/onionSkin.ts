import type { editor } from 'monaco-editor'
import type { LineChange } from './useCodeDiff'

/**
 * Build Monaco deltaDecorations for changed lines (gutter + background).
 */
export function getChangeDecorations(
  changes: LineChange[],
  _monaco: typeof import('monaco-editor')
): editor.IModelDeltaDecoration[] {
  return changes.map((c) => {
    const line = c.lineNumber
    const isAdd = c.type === 'add'
    return {
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        glyphMarginClassName: isAdd ? 'line-add-gutter' : 'line-modify-gutter',
        linesDecorationsClassName: isAdd ? 'line-add-gutter' : 'line-modify-gutter',
        className: isAdd ? 'line-add-bg' : 'line-modify-bg',
      },
    }
  })
}
