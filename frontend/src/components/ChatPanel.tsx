// frontend/src/components/ChatPanel.tsx

import React, { useState } from 'react'
import { chat } from '../api'

type Message = { role: 'user' | 'assistant'; content: string }

type Props = {
  transcript: any | null
  audit: any[] | null
  plannedTerms: any[] | null
  onUpdateAudit: (a: any[]) => void
  onUpdatePlan: (p: any[]) => void
}

export default function ChatPanel({
  transcript,
  audit,
  plannedTerms,
  onUpdateAudit,
  onUpdatePlan,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [goals, setGoals] = useState('Graduate on time and keep ~15 credits per term.')
  const [loading, setLoading] = useState(false)

  const hasTranscript = !!transcript

  async function sendMessage() {
    if (!hasTranscript || !input.trim()) return
    const newHistory: Message[] = [...messages, { role: 'user', content: input }]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await chat({
        transcript,
        goals,
        preferences: {},
        history: newHistory,
      })

      if (res.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
      }
      if (res.audit) onUpdateAudit(res.audit)
      if (res.planned_terms) onUpdatePlan(res.planned_terms)
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't process that request. Try again in a moment.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3>Conversational Advisor</h3>
      {!hasTranscript && (
        <p style={{ opacity: 0.7 }}>
          Upload a transcript first, then you can chat with the advisor about your plan.
        </p>
      )}

      <label>Goals / preferences</label>
      <textarea
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        rows={2}
        style={{ width: '100%', marginBottom: 8, borderRadius: 8, padding: 8 }}
      />

      <div
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          background: '#0b1020',
          borderRadius: 12,
          padding: 8,
          marginBottom: 8,
          border: '1px solid #253053',
        }}
      >
        {messages.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            Ask things like: “What classes am I missing?”, “Can I finish in 3 semesters?”, or
            “Can we lower next term to 12 credits?”.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 6,
              textAlign: m.role === 'user' ? 'right' : 'left',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: 10,
                background: m.role === 'user' ? '#5b7cfa' : '#1c2546',
                color: 'white',
                maxWidth: '80%',
              }}
            >
              <strong style={{ fontSize: 11, opacity: 0.8 }}>
                {m.role === 'user' ? 'You' : 'Advisor'}
              </strong>
              <div style={{ marginTop: 2 }}>{m.content}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          disabled={!hasTranscript || loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={
            hasTranscript ? 'Type a question about your plan…' : 'Upload a transcript first'
          }
          style={{ flex: 1, borderRadius: 8, padding: 8, border: '1px solid #253053' }}
        />
        <button className="btn" onClick={sendMessage} disabled={!hasTranscript || loading}>
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
