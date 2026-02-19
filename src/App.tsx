import { useState, useRef, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import './App.css'

// ── Particle canvas ──────────────────────────────────────────────
function ParticleCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)
    let raf: number

    const DARK_COLORS = [
      'rgba(99,102,241,',
      'rgba(168,85,247,',
      'rgba(236,72,153,',
      'rgba(255,255,255,',
    ]
    const LIGHT_COLORS = [
      'rgba(99,102,241,',
      'rgba(168,85,247,',
      'rgba(236,72,153,',
      'rgba(79,70,229,',
    ]

    type Particle = {
      x: number; y: number; r: number
      vx: number; vy: number
      color: string; alpha: number; da: number
    }

    const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS
    const COUNT = 55
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
      da: (Math.random() - 0.5) * 0.004,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.alpha += p.da
        if (p.alpha > (isDark ? 0.65 : 0.35)) p.da = -Math.abs(p.da)
        if (p.alpha < 0.05) p.da =  Math.abs(p.da)
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            const lineAlpha = (isDark ? 0.06 : 0.08) * (1 - dist / 110)
            ctx.strokeStyle = `rgba(99,102,241,${lineAlpha.toFixed(3)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [isDark])

  useEffect(() => {
    const cleanup = init()
    return cleanup
  }, [init])

  return <canvas ref={canvasRef} className="bg-canvas" />
}
// ─────────────────────────────────────────────────────────────────

type Role = 'assistant' | 'user'

type Message = {
  id: number
  role: Role
  content: string
  timestamp: Date
}

const HF_API_KEY = import.meta.env.VITE_HF_API_KEY

async function callHuggingFace(messages: Message[], userInput: string): Promise<string> {
  const chatMessages = [
    {
      role: 'system',
      content:
        'You are Bria-Buddy, a helpful and friendly AI assistant. Give clear, helpful, and conversational responses.',
    },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userInput },
  ]

  const response = await fetch('/hf-api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('HF Error:', errorText)
    if (response.status === 503) {
      throw new Error('Model is loading, please wait 20 seconds and try again…')
    }
    throw new Error(`Error ${response.status}: ${errorText.slice(0, 150)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.'
}

// Icons
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

const INITIAL_MESSAGE: Message = {
  id: 1,
  role: 'assistant',
  content: "Hello! I'm Bria-Buddy, your personal AI companion powered by Mistral AI! Ask me anything — I'm here to help! 😊",
  timestamp: new Date(),
}

function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [nextId, setNextId] = useState(2)
  const [isDark, setIsDark] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }, [input])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value || isTyping) return

    const userMessage: Message = {
      id: nextId,
      role: 'user',
      content: value,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNextId((prev) => prev + 1)
    setInput('')
    setIsTyping(true)

    try {
      const aiResponse = await callHuggingFace(messages, value)
      const assistantMessage: Message = {
        id: nextId + 1,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setNextId((prev) => prev + 2)
    } catch (error) {
      console.error('HuggingFace error:', error)
      const errMsg = error instanceof Error ? error.message : 'Connection error'
      const errorMessage: Message = {
        id: nextId + 1,
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setNextId((prev) => prev + 2)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) form.requestSubmit()
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const handleClear = () => {
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }])
    setNextId(2)
    setInput('')
  }

  return (
    <div className={`app-container${isDark ? ' dark' : ' light'}`}>
      {/* Aurora background layers */}
      <div className="bg-gradient" />
      <div className="bg-orb3" />
      <div className="bg-orb4" />
      <div className="bg-orb5" />
      <div className="bg-mesh" />
      <div className="bg-grain" />
      {/* Shooting stars */}
      <div className="bg-stars">
        <div className="star" /><div className="star" /><div className="star" />
        <div className="star" /><div className="star" /><div className="star" />
        <div className="star" /><div className="star" />
      </div>
      {/* Particle network canvas */}
      <ParticleCanvas isDark={isDark} />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <div className="logo-inner">
                <LayersIcon />
              </div>
            </div>
            <div className="header-text">
              <h1>Bria-Buddy</h1>
              <p>Your personal AI companion</p>
            </div>
          </div>

          <div className="header-right">
            <div className="status-indicator">
              <div className="status-dot" />
              Online
            </div>

            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={() => setIsDark(prev => !prev)}
              type="button"
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {isDark ? <MoonIcon /> : <SunIcon />}
                </span>
              </span>
            </button>

            <button className="clear-btn" onClick={handleClear} type="button">
              <TrashIcon />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        <div className="chat-container">

          {/* Messages */}
          <div className="messages-wrapper">
            <div className="date-divider">Today</div>

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`message ${message.role}${index === 0 ? ' first' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? <LayersIcon /> : <UserIcon />}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'assistant' ? 'Bria-Buddy' : 'You'}
                    </span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message assistant typing">
                <div className="message-avatar">
                  <LayersIcon />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="input-wrapper">
            <form onSubmit={handleSubmit} className="input-form">
              <textarea
                ref={textareaRef}
                className="input-field"
                placeholder="Ask me anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isTyping}
              />
              <div className="input-actions">
                <button
                  type="submit"
                  className="send-btn"
                  disabled={!input.trim() || isTyping}
                >
                  <SendIcon />
                </button>
              </div>
            </form>
            <p className="input-hint">
              Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for new line
            </p>
            <p className="powered-by">
              <span>Powered by</span>
              <strong>Mistral AI</strong>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

export default App