import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceKey)

// Minimal in-memory rate limit (best-effort; resets on cold starts)
const lastSendByUser = new Map<string, number>()
const MIN_MS = 2500

function hasLink(s: string) {
  return /(https?:\/\/|www\.)/i.test(s)
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

    const { data: userRes, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userRes.user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }

    const user = userRes.user
    const userId = user.id

    const now = Date.now()
    const last = lastSendByUser.get(userId) ?? 0
    if (now - last < MIN_MS) {
      return NextResponse.json({ error: 'Slow down.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const textRaw = String(body?.text ?? '')
    const text = textRaw.trim()

    if (!text) return NextResponse.json({ error: 'Empty message.' }, { status: 400 })
    if (text.length > 300) return NextResponse.json({ error: 'Too long.' }, { status: 400 })

    // Optional: block links for first 10 minutes
    const createdAt = new Date(user.created_at).getTime()
    if (now - createdAt < 10 * 60 * 1000 && hasLink(text)) {
      return NextResponse.json({ error: 'Links disabled for new accounts.' }, { status: 400 })
    }

    // Get username (must exist because UsernameGate blocks UI, but enforce anyway)
    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    if (profErr || !prof?.username) {
      return NextResponse.json({ error: 'Set username first.' }, { status: 400 })
    }

    const { error: insErr } = await admin.from('chat_messages').insert({
      user_id: userId,
      username_snapshot: prof.username,
      text,
    })

    if (insErr) {
      return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
    }

    lastSendByUser.set(userId, now)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
  }
}
