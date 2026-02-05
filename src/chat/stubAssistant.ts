import { rules } from './rules'

export interface StubResult {
  code: string
  message: string
  bpm?: number
}

/**
 * Run the user message through rule pattern matching; return the first match's
 * edit applied to the current code and the rule's message. Optionally return new BPM.
 */
export function processChatMessage(
  userMessage: string,
  currentCode: string,
  bpm: number
): StubResult {
  const text = userMessage.trim()
  for (const rule of rules) {
    const matches =
      typeof rule.pattern === 'function'
        ? rule.pattern(text)
        : rule.pattern.test(text)
    if (matches) {
      const code = rule.edit(currentCode, bpm)
      const out: StubResult = { code, message: rule.message }
      if (rule.setBpm) out.bpm = rule.setBpm(bpm)
      return out
    }
  }
  return {
    code: currentCode,
    message: "I didn't match that. Try: make it faster, add swing, more hats, darker, add reverb.",
  }
}
