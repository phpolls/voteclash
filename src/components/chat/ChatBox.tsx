'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Msg = {
  id: string
  created_at: string
  anon_id: string
  display_name_snapshot: string
  text: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LS_ANON_ID = 'voteclash_anon_id'
const LS_NAME = 'voteclash_chat_name'

function generateAnonId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function shortHash(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).toUpperCase().slice(0, 3)
}

export default function ChatBox() {
  const [ready, setReady] = useState(false)
  const [anonId, setAnonId] = useState('')
  const [baseName, setBaseName] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  const displayName = useMemo(() => {
    if (!anonId) return ''
    return `${baseName} #${shortHash(anonId)}`
  }, [baseName, anonId])

  // Initialize identity
  useEffect(() => {
    let id = localStorage.getItem(LS_ANON_ID)
    if (!id) {
      id = generateAnonId()
      localStorage.setItem(LS_ANON_ID, id)
    }

    let name = localStorage.getItem(LS_NAME)
    if (!name) {
      name = prompt('Choose a display name:')?.trim() || 'Anon'
      localStorage.setItem(LS_NAME, name)
    }

    setAnonId(id)
    setBaseName(name)
    setReady(true)
  }, [])

  // Load latest messages
  useEffect(() => {
    if (!ready) return

    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)

      setMessages((data as Msg[]) || [])
    }

    load()

    const channel = supabase
      .channel('chat-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const msg = payload.new as Msg
          setMessages((prev) => [...prev, msg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ready])

  // Auto scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  async function send() {
    if (!text.trim()) return
    if (text.length > 280) {
      setError('Max 280 characters.')
      return
    }

    setError(null)

    const { error } = await supabase.from('chat_messages').insert({
      anon_id: anonId,
      display_name_snapshot: displayName,
      text: text.trim(),
    })

    if (error) {
      setError(error.message)
      return
    }

    setText('')
  }

  if (!ready) return null

  return (
    <div className="flex flex-col min-h-0">
      <div
        ref={scrollRef}
        className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3"
      >
        {messages.length === 0 ? (
          <div className="text-white/35 text-xs">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-white/70 font-bold">
                  {m.display_name_snapshot}
                </span>
                <span className="text-white/40">:</span>{' '}
                <span className="text-white">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 break-words">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your message…"
          className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
        />
        <button
          onClick={send}
          className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold"
        >
          Send
        </button>
      </div>
    </div>
  )
}
