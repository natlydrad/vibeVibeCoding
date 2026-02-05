import type { ScheduledEvent } from '../audio/types'

/**
 * Hook is optional; events are passed from useAudioEngine state.
 * This file can re-export or derive event data if needed later.
 */
export function useScheduledEvents(events: ScheduledEvent[]) {
  return events
}
