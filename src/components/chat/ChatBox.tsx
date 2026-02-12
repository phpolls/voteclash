'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ChatMsg = {
  id: string
  created_at: string
  anon_id: string
  display_name_snapshot: string
  text: string
}

const LS_ANON = 'vc_chat_anon_id'
const LS_NAME = 'vc_chat_base_name'

function timeHM(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function makeAnonId() {
  // Works in modern browsers. If you need older support, tell me.
  return crypto.randomUUID()
}

function validBaseName(n: string) {
  const t = n.trim()
  return /^[a-zA-Z0-9_]{2,16}$/.test(t)
}

export default function ChatBox() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(true)

  const [anonId, setAnonId] = useState<string>('')
  const [baseName, setBaseName] = useState<string>('')
  const [nameEdit, setNameEdit] = useState<string>('')

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const needsName = useMemo(() => !baseName, [baseName])

  const canSend = useMemo(() => {
    const t = text.trim()
    return !needsName && !!anonId && t.length > 0 && t.length <= 300 && !sending
  }, [text, needsName, anonId, sending])

  function scrollToBottom() {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  async function loadInitial() {
    setLoading(true)
    setErr(null)

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, created_at, anon_id, display_name_snapshot, text')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setErr('Failed to load chat.')
      setMsgs([])
    } else {
      const rows = (data ?? []) as ChatMsg[]
      setMsgs(rows.reverse())
    }

    setLoading(false)
    requestAnimationFrame(scrollToBottom)
  }

  useEffect(() => {
    // init anon id + base name
    try {
      let a = localStorage.getItem(LS_ANON) || ''
      if (!a) {
        a = makeAnonId()
        localStorage.setItem(LS_ANON, a)
      }
      setAnonId(a)

      const n = (localStorage.getItem(LS_NAME) || '').trim()
      if (n) setBaseName(n)
      setNameEdit(n)
    } catch {
      // If localStorage blocked, still works but identity won't persist
      setAnonId(makeAnonId())
    }

    loadInitial()

    const channel = supabase
      .channel('chat_messages_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const m = payload.new as ChatMsg
          setMsgs((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev
            return [...prev, m]
          })

          requestAnimationFrame(() => {
            const el = scrollerRef.current
            if (!el) return
            const dist = el.scrollHeight - (el.scrollTop + el.clientHeight)
            if (dist < 160) scrollToBottom()
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveName() {
    const n = nameEdit.trim()
    if (!validBaseName(n)) {
      setErr('Name must be 2–16 chars: letters/numbers/underscore only.')
      return
    }
    setErr(null)
    setBaseName(n)
    try {
      localStorage.setItem(LS_NAME, n)
    } catch {}
  }

  async function send() {
    const t = text.trim()
    if (!t || !anonId || !baseName) return

    setSending(true)
    setErr(null)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId, base_name: baseName, text: t }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setErr(j?.error ?? 'Failed to send.')
      } else {
        setText('')
        requestAnimationFrame(scrollToBottom)
      }
    } catch {
      setErr('Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div
        className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3"
        ref={scrollerRef}
      >
        {loading ? (
          <div className="text-white/35 text-xs">Loading…</div>
        ) : err ? (
          <div className="text-red-300/80 text-xs">{err}</div>
        ) : msgs.length === 0 ? (
          <div className="text-white/35 text-xs">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className="text-[13px] leading-5 break-words">
                <span className="text-white font-extrabold">{m.display_name_snapshot}</span>
                <span className="text-white/40"> · {timeHM(m.created_at)}</span>
                <span className="text-white/80">: {m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name gate (local only) */}
      {needsName ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-white font-extrabold">Set display name</div>
          <div className="mt-1 text-white/60 text-xs">
            Local only. No login. Letters/numbers/underscore.
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
              placeholder="Heri"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              maxLength={16}
              disabled={sending}
            />
            <button
              className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
              onClick={saveName}
              disabled={sending}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input
            className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
            placeholder="Type your message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            maxLength={300}
          />
          <button
            className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
            onClick={send}
            disabled={!canSend}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      )}
    </>
  )
}
