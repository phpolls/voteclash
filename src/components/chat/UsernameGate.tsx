// src/components/chat/UsernameGate.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function normalize(u: string) {
  return u.trim()
}

export default function UsernameGate({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setErr(null)
    setBusy(true)

    try {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (!uid) throw new Error('Please sign in again.')

      const u = normalize(username)
      if (u.length < 3 || u.length > 20) throw new Error('3–20 chars.')
      if (!/^[a-zA-Z0-9_]+$/.test(u)) throw new Error('Only letters, numbers, underscore.')

      const { error } = await supabase.from('profiles').insert({ id: uid, username: u })
      if (error) {
        // unique violation (Postgres)
        if ((error as any).code === '23505') throw new Error('Username taken.')
        throw error
      }

      onDone()
    } catch (e: any) {
      setErr(e?.message ?? 'Failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-white font-extrabold">Create username</div>
      <div className="mt-1 text-white/60 text-xs">Set once. Can’t be changed.</div>

      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
          placeholder="heri, heri_2, heri_ph…"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={busy}
        />
        <button
          className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
          onClick={save}
          disabled={busy}
        >
          {busy ? '…' : 'Save'}
        </button>
      </div>

      {err ? <div className="mt-2 text-red-300/80 text-xs">{err}</div> : null}
    </div>
  )
}
