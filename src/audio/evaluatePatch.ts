import type { BuildPatchFn, PatchContext, PatchHandle } from './types'

/**
 * Wraps user code for sandbox evaluation. Strips export and wraps in a function
 * that receives only Tone (no network, no require). Returns the buildPatch function.
 * For local dev only – not a security sandbox.
 */
function wrapEditorCode(code: string): string {
  let stripped = code
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+function\s+/g, 'function ')
    .replace(/\bexport\s+const\s+buildPatch\s*=\s*/g, 'var buildPatch = ')
    .replace(/\bexport\s+{\s*buildPatch\s*}\s*;?\s*$/gm, '')
  stripped = stripped.trim()
  if (!stripped.includes('buildPatch')) {
    return ''
  }
  return `(function(Tone) {
    var buildPatch;
    ${stripped}
    return typeof buildPatch === 'function' ? buildPatch : null;
  })`
}

/**
 * Evaluate editor code in a minimal sandbox (Tone only). Returns the patch handle
 * or throws. Caller must pass a PatchContext with Tone and registerEvent that pushes to a
 * shared event list.
 */
export function evaluatePatch(
  code: string,
  ctx: PatchContext
): PatchHandle {
  const Tone = ctx.Tone
  if (!Tone) throw new Error('Tone not available')
  const wrapped = wrapEditorCode(code)
  if (!wrapped) throw new Error('No buildPatch function found in code')
  let fn: (Tone: unknown) => BuildPatchFn | null
  try {
    fn = new Function('return ' + wrapped)()
  } catch (e) {
    throw new Error('Parse error: ' + (e instanceof Error ? e.message : String(e)))
  }
  const buildPatch = fn(Tone)
  if (typeof buildPatch !== 'function') {
    throw new Error('buildPatch is not a function')
  }
  return buildPatch(ctx)
}
