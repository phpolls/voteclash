'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib'

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<'email' | 'phone'>('email')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('') // E.164 e.g. +63917...
  const [otp, setOtp] = useState('')

  const [stage, setStage] = useState<'enter' | 'otp'>('enter')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStage('enter')
      setOtp('')
      setErr(null)
      setBusy(false)
    }
  }, [open])

  if (!open) return null

  async function requestOtp() {
    setErr(null)
    setBusy(true)
    try {
      if (tab === 'email') {
        const e = email.trim()
        if (!e) throw new Error('Enter email.')
        const { error } = await supabase.auth.signInWithOtp({ email: e })
        if (error) throw error
      } else {
        const p = phone.trim()
        if (!p) throw new Error('Enter phone.')
        const { error } = await supabase.auth.signInWithOtp({ phone: p })
        if (error) throw error
      }
      setStage('otp')
    } catch (e: any) {
      setErr(e?.message ?? 'Failed.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp() {
    setErr(null)
    setBusy(true)
    try {
      const code = otp.trim()
      if (!code) throw new Error('Enter OTP.')

      if (tab === 'email') {
        const e = email.trim()
        const { error } = await supabase.auth.verifyOtp({
          email: e,
          token: code,
          type: 'email',
        })
        if (error) throw error
      } else {
        const p = phone.trim()
        const { error } = await supabase.auth.verifyOtp({
          phone: p,
          token: code,
          type: 'sms',
        })
        if (error) throw error
      }

      onClose()
    } catch (e: any) {
      setErr(e?.message ?? 'Failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0f]/95 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="text-white font-extrabold">Sign in to chat</div>
          <button className="text-white/70 font-bold" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className={[
              'flex-1 h-10 rounded-2xl border font-extrabold',
              tab === 'email'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white border-white/10',
            ].join(' ')}
            onClick={() => {
              setTab('email')
              setStage('enter')
              setErr(null)
              setOtp('')
            }}
          >
            Email
          </button>
          <button
            className={[
              'flex-1 h-10 rounded-2xl border font-extrabold',
              tab === 'phone'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white border-white/10',
            ].join(' ')}
            onClick={() => {
              setTab('phone')
              setStage('enter')
              setErr(null)
              setOtp('')
            }}
          >
            Phone
          </button>
        </div>

        {stage === 'enter' ? (
          <div className="mt-3 space-y-3">
            {tab === 'email' ? (
              <input
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            ) : (
              <input
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
                placeholder="+63917xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            )}

            {err ? <div className="text-red-300/80 text-xs">{err}</div> : null}

            <button
              className="w-full h-11 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
              onClick={requestOtp}
              disabled={busy}
            >
              {busy ? '…' : 'Request OTP'}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="text-white/70 text-xs">
              Enter the OTP we sent to your {tab === 'email' ? 'email' : 'phone'}.
            </div>

            <input
              className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={busy}
            />

            {err ? <div className="text-red-300/80 text-xs">{err}</div> : null}

            <button
              className="w-full h-11 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
              onClick={verifyOtp}
              disabled={busy}
            >
              {busy ? '…' : 'Verify'}
            </button>

            <button
              className="w-full h-11 rounded-2xl bg-white/5 text-white font-extrabold border border-white/10 disabled:opacity-60"
              onClick={requestOtp}
              disabled={busy}
            >
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
