/**
 * Event registered by a patch for timeline visualization.
 * time: in "bars" (e.g. 0 = bar 0, 1.5 = bar 1 beat 3)
 * duration: in bars
 */
export interface ScheduledEvent {
  time: number
  duration: number
  label: string
  lane: string
}

export type RegisterEvent = (event: ScheduledEvent) => void

/** Tone library instance passed into the sandbox (no network imports). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToneLib = any

/**
 * Context passed to buildPatch. Provides Tone, Transport, and a way to
 * register events for the visualizer.
 */
export interface PatchContext {
  Tone: ToneLib
  Transport: { bpm: { value: number }; swing: number; start: () => void; stop: () => void; seconds: number }
  bpm: number
  volume: number
  destination: unknown
  registerEvent: RegisterEvent
}

/**
 * Handle returned by buildPatch. Must dispose all nodes and stop loops.
 */
export interface PatchHandle {
  dispose(): void
}

/**
 * The patch module must export a function with this signature.
 * It receives the context and returns a handle for disposal.
 */
export type BuildPatchFn = (ctx: PatchContext) => PatchHandle
