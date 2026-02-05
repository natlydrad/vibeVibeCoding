import { rules } from './rules'
import { editPatch } from './llmAssistant'

export interface StubResult {
  code: string
  message: string
  bpm?: number
}

/**
 * Try LLM first; if unavailable or error, fall back to rule-based matching.
 */
export async function processChatMessageAsync(
  userMessage: string,
  currentCode: string,
  bpm: number
): Promise<StubResult> {
  const llmResult = await editPatch(userMessage, currentCode, bpm)
  if (llmResult) {
    return { code: llmResult.code, message: llmResult.message }
  }
  return processChatMessage(userMessage, currentCode, bpm)
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
