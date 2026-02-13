import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

const COOKIE_NAME = 'a2h_voter_id'
const ADMIN_KEY = process.env.ADMIN_VOTE_KEY || ''

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

function isAdminBypass() {
  if (!ADMIN_KEY) return false
  const h = headers()
  return h.get('x-admin-vote-key') === ADMIN_KEY
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const candidateSlug = String(body?.candidateId ?? '').trim()
    if (!candidateSlug) {
      return NextResponse.json({ ok: false, error: 'Missing candidateId' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    // Candidate must exist (by slug)
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

    const admin = isAdminBypass()

    if (!admin) {
      // PUBLIC: one vote only (per cookie voter_id)
      const voterId = await getOrSetVoterId()

      const { error: voteErr } = await db.from('presidential_votes').insert({
        voter_id: voterId,
        candidate_slug: candidateSlug,
      })

      if (voteErr) {
        const msg = (voteErr.message || '').toLowerCase()
        if (msg.includes('duplicate') || msg.includes('unique')) {
          return NextResponse.json({ ok: false, alreadyVoted: true }, { status: 200, headers: NO_STORE_HEADERS })
        }
        return NextResponse.json({ ok: false, error: voteErr.message }, { status: 500, headers: NO_STORE_HEADERS })
      }
    }

    // ADMIN or PUBLIC: increment total by slug
    const { error: upErr } = await db.rpc('increment_presidentiables_vote_by_slug', {
      candidate_slug: candidateSlug,
    })

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500, headers: NO_STORE_HEADERS })
    }

    return NextResponse.json({ ok: true, adminBypass: admin }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || 'President vote failed') },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
