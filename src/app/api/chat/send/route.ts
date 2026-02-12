import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceKey)

const lastByAnon = new Map<string, number>()
const lastByIp = new Map<string, number>()
const firstSeenAnon = new Map<string, number>()
const firstSeenIp = new Map<string, number>()

const MIN_MS = 2500
const NEW_WINDOW_MS = 10 * 60 * 1000

function getIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for') || ''
  const ip = xf.split(',')[0].trim()
  return ip || 'unknown'
}

function hasLink(s: string) {
  return /(https?:\/\/|www\.)/i.test(s)
}

function shortHash(anonId: string) {
  return crypto.createHash('sha256').update(anonId).digest('hex').slice(0, 3).toUpperCase()
}

function cleanBaseName(name: string) {
  const n = (name || '').trim()
  if (!/^[a-zA-Z0-9_]{2,16}$/.test(n)) return null
  return n
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    const now = Date.now()

    const body = await req.json().catch(() => null)
    const anonId = String(body?.anon_id ?? '').trim()
    const baseNameRaw = String(body?.base_name ?? '').trim()
    const textRaw = String(body?.text ?? '')
    const text = textRaw.trim()

    if (!anonId) return NextResponse.json({ error: 'Missing anon_id.' }, { status: 400 })
    if (!text) return NextResponse.json({ error: 'Empty message.' }, { status: 400 })
    if (text.length > 300) return NextResponse.json({ error: 'Too long.' }, { status: 400 })

    const baseName = cleanBaseName(baseNameRaw)
    if (!baseName) {
      return NextResponse.json(
        { error: 'Name must be 2–16 chars: letters/numbers/underscore only.' },
        { status: 400 }
      )
    }

    const lastA = lastByAnon.get(anonId) ?? 0
    if (now - lastA < MIN_MS) return NextResponse.json({ error: 'Slow down.' }, { status: 429 })

    const lastI = lastByIp.get(ip) ?? 0
    if (now - lastI < MIN_MS) return NextResponse.json({ error: 'Slow down.' }, { status: 429 })

    if (!firstSeenAnon.has(anonId)) firstSeenAnon.set(anonId, now)
    if (!firstSeenIp.has(ip)) firstSeenIp.set(ip, now)

    const anonAge = now - (firstSeenAnon.get(anonId) ?? now)
    const ipAge = now - (firstSeenIp.get(ip) ?? now)
    if ((anonAge < NEW_WINDOW_MS || ipAge < NEW_WINDOW_MS) && hasLink(text)) {
      return NextResponse.json({ error: 'Links disabled for new users.' }, { status: 400 })
    }

    const tag = shortHash(anonId)
    const display = `${baseName} #${tag}`

    const { error: insErr } = await admin.from('chat_messages').insert({
      anon_id: anonId,
      display_name_snapshot: display,
      text,
    })

    if (insErr) return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })

    lastByAnon.set(anonId, now)
    lastByIp.set(ip, now)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
  }
}
