'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Msg = {
  id: string
  created_at: string
  anon_id: string | null
  display_name: string | null
  text: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const supabase = createClient(supabaseUrl, anonKey)

const LS_ANON_ID = 'voteclash_anon_id'

function makeAnonId() {
  // crypto.randomUUID is best, fallback otherwise
  const c: any = typeof window !== 'undefined' ? (window as any).crypto : null
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
}

function shortHash(s: string) {
  // tiny deterministic hash -> 3 hex chars
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const hex = (h >>> 0).toString(16).toUpperCase()
  return hex.slice(0, 3).padEnd(3, '0')
}

export default function ChatBox() {
  const [ready, setReady] = useState(false)
  const [anonId, setAnonId] = useState<string>('')
  const displayName = useMemo(() => {
    if (!anonId) return 'Anon #---'
    return `Anon #${shortHash(anonId)}`
  }, [anonId])

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // init anon id
    try {
      const existing = localStorage.getItem(LS_ANON_ID)
      const id = existing && existing.length >= 8 ? existing : makeAnonId()
      localStorage.setItem(LS_ANON_ID, id)
      setAnonId(id)
    } catch {
      setAnonId(makeAnonId())
    }
    setReady(true)
  }, [])

  async function loadLatest() {
    setErr(null)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id,created_at,anon_id,display_name,text')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setErr(error.message)
      return
    }

    const list = (data ?? []) as Msg[]
    setMessages(list.reverse())
  }

  useEffect(() => {
    if (!ready) return

    loadLatest()

    const channel = supabase
      .channel('chat_messages_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as any
          const m: Msg = {
            id: String(row.id),
            created_at: String(row.created_at),
            anon_id: row.anon_id ?? null,
            display_name: row.display_name ?? null,
            text: String(row.text ?? ''),
          }
          setMessages((prev) => {
            // avoid dupes
            if (prev.some((x) => x.id === m.id)) return prev
            return [...prev, m]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ready])

  useEffect(() => {
    // auto-scroll to bottom on new messages
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function send() {
    if (sending) return
    const t = text.trim()
    if (!t) return
    if (t.length > 280) {
      setErr('Max 280 chars.')
      return
    }

    setSending(true)
    setErr(null)

    const { error } = await supabase.from('chat_messages').insert({
      anon_id: anonId,
      display_name: displayName,
      text: t,
    })

    if (error) {
      setErr(error.message)
      setSending(false)
      return
    }

    setText('')
    setSending(false)
  }

  if (!ready) return null

  return (
    <div className="flex flex-col min-h-0">
      <div className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3" ref={scrollerRef}>
        {messages.length === 0 ? (
          <div className="text-white/35 text-xs">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm leading-snug">
                <span className="text-white/70 font-extrabold">
                  {m.display_name || 'Anon'}
                </span>
                <span className="text-white/35">:</span>{' '}
                <span className="text-white">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {err ? <div className="mt-2 text-xs text-red-300 break-words">{err}</div> : null}

      <div className="mt-3 flex-shrink-0 flex items-center gap-2">
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
