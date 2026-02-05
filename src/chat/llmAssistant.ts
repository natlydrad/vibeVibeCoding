export interface LlmEditResult {
  code: string
  message: string
}

const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5002'

const useProxy = import.meta.env.DEV && !import.meta.env.VITE_CHAT_API_URL

function getBaseUrl(): string {
  return useProxy ? '/chat-api' : CHAT_API_URL
}

/**
 * Call the chat-api backend to edit the patch via LLM.
 * Returns null on network/API error (caller should fall back to rules).
 */
export async function editPatch(
  userMessage: string,
  currentCode: string,
  bpm: number
): Promise<LlmEditResult | null> {
  const url = `${getBaseUrl()}/chat/edit`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: userMessage.trim(),
        currentCode,
        bpm,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      console.warn('Chat API error:', err)
      return null
    }
    const data = await res.json()
    if (typeof data.code !== 'string' || typeof data.message !== 'string') {
      console.warn('Chat API invalid response shape:', data)
      return null
    }
    return { code: data.code, message: data.message }
  } catch (err) {
    console.warn('Chat API request failed:', err)
    return null
  }
}
