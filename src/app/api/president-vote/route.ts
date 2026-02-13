import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

const COOKIE_NAME = 'a2h_voter_id'
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY as string

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

async function getOrSetVoterId() {
  const jar = await cookies()
  const existing = jar.get(COOKIE_NAME)?.value
  if (existing) return existing

  const voterId = randomUUID()
  jar.set(COOKIE_NAME, voterId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return voterId
}

async function verifyTurnstile(tsToken: string) {
  if (!TURNSTILE_SECRET_KEY) return false

  const form = new FormData()
  form.append('secret', TURNSTILE_SECRET_KEY)
  form.append('response', tsToken)

  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })

  const data = (await r.json()) as { success?: boolean }
  return !!data?.success
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const candidateSlug = String(body?.candidateId ?? '').trim()
    const tsToken = String(body?.tsToken ?? '').trim()

    if (!candidateSlug) {
      return NextResponse.json({ ok: false, error: 'Missing candidateId' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    if (!tsToken) {
      return NextResponse.json({ ok: false, error: 'Missing tsToken' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const ok = await verifyTurnstile(tsToken)
    if (!ok) {
      return NextResponse.json({ ok: false, captchaFailed: true }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const voterId = await getOrSetVoterId()

    // ✅ 1) Check candidate exists (slug-based)
    const { data: cand, error: candErr } = await db
      .from('Presidentiables')
      .select('slug')
      .eq('slug', candidateSlug)
      .single()

    if (candErr || !cand?.slug) {
      return NextResponse.json(
        { ok: false, error: `Candidate not found for slug: ${candidateSlug}` },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    // ✅ 2) Insert ONE vote only (PK voter_id blocks repeats)
    const { error: voteErr } = await db.from('presidential_votes').insert({
      voter_id: voterId,
      candidate_slug: candidateSlug,
    })

    if (voteErr) {
      const msg = (voteErr.message || '').toLowerCase()
      const already = msg.includes('duplicate') || msg.includes('unique')
      if (already) {
        return NextResponse.json({ ok: false, alreadyVoted: true }, { status: 200, headers: NO_STORE_HEADERS })
      }
      return NextResponse.json({ ok: false, error: voteErr.message }, { status: 500, headers: NO_STORE_HEADERS })
    }

    // ✅ 3) Increment totals by slug (no UUID anywhere)
    const { error: upErr } = await db.rpc('increment_presidentiables_vote_by_slug', {
      candidate_slug: candidateSlug,
    })

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500, headers: NO_STORE_HEADERS })
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || 'President vote failed') },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
