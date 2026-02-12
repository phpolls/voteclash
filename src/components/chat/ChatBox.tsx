'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Msg = {
  id: string
  created_at: string
  anon_id: string
  display_name_snapshot: string
  text: string
}

const LS_ANON_ID = 'voteclash_anon_id'
const LS_NAME = 'voteclash_chat_name'

function generateAnonId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function shortHash(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0).toString(16).toUpperCase().slice(0, 3) || '000')
}

export default function ChatBox() {
  const [ready, setReady] = useState(false)
  const [anonId, setAnonId] = useState('')
  const [baseName, setBaseName] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // init anon id + name
  useEffect(() => {
    try {
      let id = localStorage.getItem(LS_ANON_ID)
      if (!id) {
        id = generateAnonId()
        localStorage.setItem(LS_ANON_ID, id)
      }
      setAnonId(id)

      const storedName = localStorage.getItem(LS_NAME)
      setBaseName(storedName?.trim() || '')
    } catch {
      setAnonId(generateAnonId())
      setBaseName('')
    }

    setReady(true)
  }, [])

  const tag = useMemo(() => {
    if (!anonId) return '000'
    return shortHash(anonId)
  }, [anonId])

  const displayNameSnapshot = useMemo(() => {
    if (!baseName.trim()) return ''
    return `${baseName.trim()} #${tag}`
  }, [baseName, tag])

  // load messages
  useEffect(() => {
    if (!ready) return

    async function load() {
      const { data } = await supabase
        .from('chat_messages')
        .select('id,created_at,anon_id,display_name_snapshot,text')
        .order('created_at', { ascending: true })
        .limit(50)

      setMessages((data as Msg[]) || [])
    }

    load()

    const channel = supabase
      .channel('chat_live')
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

  // auto scroll
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  async function send() {
    if (sending) return

    if (!baseName.trim()) {
      setError('Set your name before chatting.')
      return
    }

    if (!text.trim()) return
    if (text.length > 280) {
      setError('Max 280 characters.')
      return
    }

    setSending(true)
    setError(null)

    const { error } = await supabase.from('chat_messages').insert({
      anon_id: anonId,
      display_name_snapshot: displayNameSnapshot,
      text: text.trim(),
    })

    if (error) {
      setError(error.message)
    }

    setText('')
    setSending(false)
  }

  async function saveName(name: string) {
    const cleaned = name.trim().slice(0, 18)
    setBaseName(cleaned)
    try {
      localStorage.setItem(LS_NAME, cleaned)
    } catch {}
  }

  if (!ready) return null

  return (
    <div className="flex flex-col min-h-0">
      {/* name input */}
      <div className="mt-3 flex items-center gap-2">
        <div className="text-white/60 text-xs font-extrabold uppercase">You</div>
        <input
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          onBlur={() => saveName(baseName)}
          className="h-9 w-44 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm outline-none"
          placeholder="Enter name"
        />
        {baseName ? (
          <div className="text-white/50 text-sm font-extrabold">#{tag}</div>
        ) : null}
      </div>

      {/* messages */}
      <div
        ref={scrollerRef}
        className="mt-3 flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3"
      >
        {messages.length === 0 ? (
          <div className="text-white/35 text-xs">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-white/70 font-extrabold">
                  {m.display_name_snapshot}
                </span>
                <span className="text-white/40">: </span>
                <span className="text-white">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-2 text-xs text-red-300 break-words">{error}</div>
      ) : null}

      {/* input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
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
