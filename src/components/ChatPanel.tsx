import { useState, useRef, useEffect } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  code: string
  message: string
  bpm?: number
}

interface ChatPanelProps {
  onSend: (text: string) => ChatResult
  onApplyEdit: (result: ChatResult) => void
}

export function ChatPanel({ onSend, onApplyEdit }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((m) => [...m, userMsg])

    const result = onSend(text)
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: result.message }])
    onApplyEdit(result)
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-placeholder">Ask for changes, e.g. &quot;make it faster&quot;, &quot;add swing&quot;, &quot;more hats&quot;</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.role}`}>
            <span className="chat-role">{m.role}</span>
            <span className="chat-content">{m.content}</span>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type instruction..."
        />
        <button type="button" className="chat-send" onClick={send}>
          Send
        </button>
      </div>
    </div>
  )
}
