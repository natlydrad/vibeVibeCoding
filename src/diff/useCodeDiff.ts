import { useMemo } from 'react'
import { diffLines } from 'diff'

export interface LineChange {
  lineNumber: number
  type: 'add' | 'remove' | 'modify'
}

export interface ChangeHunk {
  type: 'add' | 'remove' | 'modify'
  startLine: number
  endLine: number
}

/**
 * Line-based diff between previous and current code.
 * Returns decorations (line number + type) and hunks for the change markers panel.
 */
export function useCodeDiff(previousCode: string | null, currentCode: string) {
  return useMemo(() => {
    if (!previousCode || previousCode === currentCode) {
      return { decorations: [] as LineChange[], hunks: [] as ChangeHunk[] }
    }

    const changes = diffLines(previousCode, currentCode)
    const decorations: LineChange[] = []
    const hunks: ChangeHunk[] = []

    let prevLine = 0
    let currLine = 0

    for (const change of changes) {
      const lines = change.count ?? (change.value ? change.value.split(/\r?\n/).length : 0)
      const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1)

      if (change.added) {
        lineNumbers.forEach((_, i) => {
          decorations.push({ lineNumber: currLine + i + 1, type: 'add' })
        })
        if (lines > 0) {
          hunks.push({ type: 'add', startLine: currLine + 1, endLine: currLine + lines })
        }
        currLine += lines
      } else if (change.removed) {
        lineNumbers.forEach((_, i) => {
          decorations.push({ lineNumber: prevLine + i + 1, type: 'remove' })
        })
        if (lines > 0) {
          hunks.push({ type: 'remove', startLine: prevLine + 1, endLine: prevLine + lines })
        }
        prevLine += lines
      } else {
        prevLine += lines
        currLine += lines
      }
    }

    // Merge adjacent add/remove into modify for display
    const mergedHunks: ChangeHunk[] = []
    for (const h of hunks) {
      const last = mergedHunks[mergedHunks.length - 1]
      if (last && (last.type === h.type || (last.type === 'remove' && h.type === 'add')) && last.endLine >= h.startLine - 1) {
        last.endLine = Math.max(last.endLine, h.endLine)
        if (last.type === 'remove' && h.type === 'add') last.type = 'modify'
      } else {
        mergedHunks.push({ ...h })
      }
    }

    return { decorations, hunks: mergedHunks }
  }, [previousCode, currentCode])
}
