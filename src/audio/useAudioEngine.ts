import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { evaluatePatch } from './evaluatePatch'
import { defaultPatch } from './defaultPatch'
import type { PatchContext, PatchHandle, ScheduledEvent } from './types'

const STORAGE_KEY = 'vibevibecoding-state'
const DEFAULT_BPM = 120
const DEFAULT_VOLUME = 0

export interface PersistedState {
  patchCode: string
  bpm: number
  volume: number
  title?: string
  lastSavedAt?: string
}

function loadPersisted(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

export function savePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastSavedAt: new Date().toISOString(),
    }))
  } catch {
    // ignore
  }
}

export function useAudioEngine() {
  const [bpm, setBpmState] = useState(() => {
    const p = loadPersisted()
    return p?.bpm ?? DEFAULT_BPM
  })
  const [volume, setVolumeState] = useState(() => {
    const p = loadPersisted()
    return p?.volume ?? DEFAULT_VOLUME
  })
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transportSeconds, setTransportSeconds] = useState(0)

  const patchHandleRef = useRef<PatchHandle | null>(null)
  const lastKnownGoodRef = useRef<string>(defaultPatch.trim())
  const eventsListRef = useRef<ScheduledEvent[]>([])
  const wasPlayingRef = useRef(false)
  const rafRef = useRef<number>(0)
  const masterVolumeRef = useRef<InstanceType<typeof Tone.Volume> | null>(null)
  const waveformRef = useRef<InstanceType<typeof Tone.Waveform> | null>(null)

  if (!masterVolumeRef.current) {
    const master = new Tone.Volume(DEFAULT_VOLUME).toDestination()
    const waveform = new Tone.Waveform(256)
    master.connect(waveform)
    masterVolumeRef.current = master
    waveformRef.current = waveform
  }

  const applyBpm = useCallback((value: number) => {
    Tone.getTransport().bpm.value = value
  }, [])

  const applyVolume = useCallback((_value: number) => {
    // Master volume is applied when building the patch via ctx.volume
  }, [])

  const setBpm = useCallback((value: number) => {
    setBpmState(value)
    applyBpm(value)
  }, [applyBpm])

  const setVolume = useCallback((value: number) => {
    setVolumeState(value)
    applyVolume(value)
  }, [applyVolume])

  const buildContext = useCallback((
    registerEvent: (e: ScheduledEvent) => void
  ): PatchContext => {
    const transport = Tone.getTransport()
    const master = masterVolumeRef.current
    if (master) master.volume.value = volume
    return {
      Tone,
      Transport: transport,
      bpm,
      volume,
      destination: master ?? Tone.getDestination(),
      registerEvent,
    }
  }, [bpm, volume])

  const applyCode = useCallback((code: string) => {
    setError(null)
    wasPlayingRef.current = Tone.getTransport().state === 'started'
    Tone.getTransport().stop()

    if (patchHandleRef.current) {
      try {
        patchHandleRef.current.dispose()
      } catch (_) {
        // ignore
      }
      patchHandleRef.current = null
    }

    eventsListRef.current = []
    const registerEvent = (e: ScheduledEvent) => {
      eventsListRef.current.push(e)
    }

    const ctx = buildContext(registerEvent)
    try {
      const handle = evaluatePatch(code, ctx)
      patchHandleRef.current = handle
      lastKnownGoodRef.current = code
      setEvents([...eventsListRef.current])
      if (wasPlayingRef.current) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setEvents([...eventsListRef.current])
      if (wasPlayingRef.current && patchHandleRef.current) {
        Tone.getTransport().start()
      }
      return false
    }
  }, [buildContext])

  const play = useCallback(() => {
    if (patchHandleRef.current) {
      Tone.getTransport().start()
      setIsPlaying(true)
    }
  }, [])

  const stop = useCallback(() => {
    Tone.getTransport().stop()
    setIsPlaying(false)
  }, [])

  const revertToLastGood = useCallback(() => lastKnownGoodRef.current, [])

  useEffect(() => {
    applyBpm(bpm)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init only

  useEffect(() => {
    const transport = Tone.getTransport()
    const tick = () => {
      if (transport.state === 'started') {
        setTransportSeconds(transport.seconds)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const getInitialCode = useCallback(() => {
    const p = loadPersisted()
    if (p?.patchCode) return p.patchCode
    return defaultPatch.trim()
  }, [])

  return {
    bpm,
    setBpm,
    volume,
    setVolume,
    events,
    error,
    setError,
    isPlaying,
    transportSeconds,
    applyCode,
    play,
    stop,
    lastKnownGood: lastKnownGoodRef.current,
    revertToLastGood,
    getInitialCode,
    applyBpm,
    loadPersisted,
    savePersisted,
    waveformRef,
  }
}
