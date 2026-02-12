'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib'
import AuthModal from '@/components/chat/AuthModal'
import UsernameGate from '@/components/chat/UsernameGate'

type ChatMsg = {
  id: string
  created_at: string
  user_id: string
  username_snapshot: string
  text: string
}

function timeHM(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBox() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(true)

  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  const [authOpen, setAuthOpen] = useState(false)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => {
    const t = text.trim()
    return !!sessionUserId && !needsUsername && t.length > 0 && t.length <= 300 && !sending
  }, [text, sessionUserId, needsUsername, sending])

  function scrollToBottom() {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  async function refreshSessionAndProfile() {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id ?? null
    setSessionUserId(uid)

    if (!uid) {
      setNeedsUsername(false)
      return
    }

    const { data: prof, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', uid)
      .maybeSingle()

    // If row missing, force username creation
    if (!error && !prof) setNeedsUsername(true)
    else setNeedsUsername(false)
  }

  async function loadInitial() {
    setLoading(true)
    setErr(null)

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, created_at, user_id, username_snapshot, text')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setErr('Failed to load chat.')
      setMsgs([])
    } else {
      const rows = (data ?? []) as ChatMsg[]
      setMsgs(rows.reverse()) // show oldest -> newest
    }

    setLoading(false)
    requestAnimationFrame(scrollToBottom)
  }

  useEffect(() => {
    loadInitial()
    refreshSessionAndProfile()

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      refreshSessionAndProfile()
    })

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
            // Only autoscroll if user is near bottom
            const el = scrollerRef.current
            if (!el) return
            const dist = el.scrollHeight - (el.scrollTop + el.clientHeight)
            if (dist < 160) scrollToBottom()
          })
        }
      )
      .subscribe()

    return () => {
      authSub.subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleTapComposer() {
    setErr(null)
    if (!sessionUserId) {
      setAuthOpen(true)
      return
    }
    if (needsUsername) return
  }

  async function send() {
    const t = text.trim()
    if (!t) return
    if (!sessionUserId || needsUsername) return

    setSending(true)
    setErr(null)

    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    if (!token) {
      setSending(false)
      setErr('Please sign in again.')
      setAuthOpen(true)
      return
    }

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: t }),
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
      <div className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3" ref={scrollerRef}>
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
                <span className="text-white font-extrabold">{m.username_snapshot}</span>
                <span className="text-white/40"> · {timeHM(m.created_at)}</span>
                <span className="text-white/80">: {m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {needsUsername ? (
        <div className="mt-3">
          <UsernameGate
            onDone={async () => {
              await refreshSessionAndProfile()
            }}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input
            className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
            placeholder={sessionUserId ? 'Type your message…' : 'Sign in to chat…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={handleTapComposer}
            onClick={handleTapComposer}
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

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
