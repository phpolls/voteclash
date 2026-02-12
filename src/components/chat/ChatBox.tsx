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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
}

function shortHash(input: string) {
  // stable small hash => 3 hex chars
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0).toString(16).toUpperCase().slice(0, 3) || '000').padEnd(3, '0')
}

export default function ChatBox() {
  const [ready, setReady] = useState(false)
  const [anonId, setAnonId] = useState('')
  const [baseName, setBaseName] = useState('Anon')

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      let id = localStorage.getItem(LS_ANON_ID)
      if (!id) {
        id = generateAnonId()
        localStorage.setItem(LS_ANON_ID, id)
      }
      setAnonId(id)

      const storedName = localStorage.getItem(LS_NAME)
      setBaseName((storedName && storedName.trim()) || 'Anon')
    } catch {
      setAnonId(generateAnonId())
      setBaseName('Anon')
    }

    setReady(true)
  }, [])

  const tag = useMemo(() => (anonId ? shortHash(anonId) : '000'), [anonId])
  const displayNameSnapshot = useMemo(() => `${(baseName || 'Anon').trim() || 'Anon'} #${tag}`, [baseName, tag])

  async function loadLatest() {
    setError(null)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id,created_at,anon_id,display_name_snapshot,text')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      setError(error.message)
      return
    }

    setMessages((data as Msg[]) || [])
  }

  useEffect(() => {
    if (!ready) return

    loadLatest()

    const channel = supabase
      .channel('chat_messages_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new as Msg
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function saveName(next: string) {
    const cleaned = next.trim().slice(0, 18) || 'Anon'
    setSavingName(true)
    try {
      localStorage.setItem(LS_NAME, cleaned)
    } catch {}
    setBaseName(cleaned)
    setSavingName(false)
  }

  async function send() {
    if (sending) return
    const t = text.trim()
    if (!t) return
    if (t.length > 280) {
      setError('Max 280 characters.')
      return
    }
    if (!anonId) {
      setError('Missing anon id.')
      return
    }

    setSending(true)
    setError(null)

    const { error } = await supabase.from('chat_messages').insert({
      anon_id: anonId,
      display_name_snapshot: displayNameSnapshot,
      text: t,
    })

    if (error) {
      setError(error.message)
      setSending(false)
      return
    }

    setText('')
    setSending(false)
  }

  if (!ready) return null

  return (
    <div className="flex flex-col min-h-0">
      {/* Name row INSIDE chat (no popup, no blocking) */}
      <div className="mt-3 flex items-center gap-2">
        <div className="text-white/60 text-xs font-extrabold tracking-[0.25em] uppercase">You</div>
        <input
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          onBlur={() => saveName(baseName)}
          className="h-9 w-44 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm outline-none"
        />
        <div className="text-white/50 text-sm font-extrabold">#{tag}</div>
        {savingName ? <div className="text-white/40 text-xs">saving…</div> : null}
      </div>

      <div
        ref={scrollerRef}
        className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3"
      >
        {messages.length === 0 ? (
          <div className="text-white/35 text-xs">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm leading-snug">
                <span className="text-white/70 font-extrabold">{m.display_name_snapshot}</span>
                <span className="text-white/35">:</span>{' '}
                <span className="text-white">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? <div className="mt-2 text-xs text-red-300 break-words">{error}</div> : null}

      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
          placeholder="Type your message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <button
          className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
          onClick={send}
          disabled={sending}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
