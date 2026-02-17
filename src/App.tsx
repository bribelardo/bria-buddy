import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Role = 'assistant' | 'user'

type Message = {
  id: number
  role: Role
  content: string
  timestamp: Date
}

// Smart fallback responses based on keywords when Gemini is unavailable
const getSmartResponse = (userInput: string): string => {
  const input = userInput.toLowerCase()
  
  // Greetings
  if (input.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return "Hello! I'm Bria-Buddy, your AI companion. How can I help you today?"
  }
  
  // How are you
  if (input.match(/how are you|how're you|how r u/)) {
    return "I'm doing great, thank you for asking! I'm here and ready to help you with any questions or tasks you have. What would you like to talk about?"
  }
  
  // What can you do
  if (input.match(/what can you do|what do you do|your capabilities|help me/)) {
    return "I can help you with many things! I can answer questions, provide information, help with problem-solving, have conversations, give advice, and much more. What specifically would you like assistance with?"
  }
  
  // Tell me about / explain
  if (input.match(/tell me about|what is|what are|explain/)) {
    return "That's an interesting topic. I can give you a high-level, general explanation, and you can ask follow-up questions if you want to go deeper."
  }
  
  // Programming/coding questions
  if (input.match(/code|program|javascript|python|react|css|html/)) {
    return "I can help with coding questions and general programming concepts. Tell me what you're building or what error you're seeing, and I'll walk you through it step by step."
  }
  
  // Thank you
  if (input.match(/thank you|thanks|thank u|ty/)) {
    return "You're very welcome! I'm happy to help. Feel free to ask me anything else!"
  }
  
  // Goodbye
  if (input.match(/bye|goodbye|see you|exit|quit/)) {
    return "Goodbye! It was great chatting with you. Come back anytime you need assistance!"
  }
  
  // Who are you
  if (input.match(/who are you|your name|what are you/)) {
    return "I'm Bria-Buddy, your personal AI companion. I'm here to answer questions, help you think through ideas, and keep the conversation flowing."
  }
  
  // Default response with user's input acknowledged
  return `I understand you're asking about "${userInput}". Here's a general high-level response. If you'd like something more specific, try adding more details or asking a follow-up question.`
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hello! I'm Bria-Buddy, your AI companion. Ask me anything, and I'll do my best to help with useful, conversational answers.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [nextId, setNextId] = useState(2)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value) return

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

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

    const useFallback = () => {
      const smartResponse = getSmartResponse(value)
      const assistantMessage: Message = {
        id: nextId + 1,
        role: 'assistant',
        content: smartResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setNextId((prev) => prev + 2)
    }

    if (!apiKey) {
      useFallback()
      setIsTyping(false)
      return
    }

    try {
      const historyContents = messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }))

      const body = {
        contents: [
          ...historyContents,
          {
            role: 'user',
            parts: [{ text: value }],
          },
        ],
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data: any = await response.json()

      const assistantText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text)
          .filter((text: unknown): text is string => typeof text === 'string')
          .join('\n\n') || getSmartResponse(value)

      const assistantMessage: Message = {
        id: nextId + 1,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setNextId((prev) => prev + 2)
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      useFallback()
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleClear = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content:
          "Hello! I'm Bria-Buddy, your AI companion. Ask me anything, and I'll do my best to help with useful, conversational answers.",
        timestamp: new Date(),
      },
    ])
    setNextId(2)
    setInput('')
  }

  return (
    <div className="app-container">
      {/* Animated background */}
      <div className="bg-gradient"></div>
      <div className="bg-grain"></div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="header-text">
              <h1>Bria-Buddy</h1>
              <p>Your personal AI companion</p>
            </div>
          </div>
          <button className="clear-btn" onClick={handleClear} type="button">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Clear
          </button>
        </div>
      </header>

      {/* Main chat area */}
      <main className="main-content">
        <div className="chat-container">
          <div className="messages-wrapper">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`message ${message.role} ${index === 0 ? 'first' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'assistant' ? 'Assistant' : 'You'}
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
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="input-wrapper">
            <form onSubmit={handleSubmit} className="input-form">
              <textarea
                ref={textareaRef}
                className="input-field"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() || isTyping}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
            <p className="input-hint">
              Press Enter to send • Shift+Enter for new line • Demo Mode
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
