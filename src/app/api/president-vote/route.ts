import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

const MAX_PER_IP_PER_DAY = 3
const IP_HASH_SALT = process.env.IP_HASH_SALT as string

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

async function getClientIp(): Promise<string> {
  const h = await headers()

  const vercel = h.get('x-vercel-forwarded-for')
  if (vercel) return vercel.split(',')[0].trim()

  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()

  const real = h.get('x-real-ip')
  if (real) return real.trim()

  return 'unknown'
}

function hashIp(ip: string) {
  return createHash('sha256').update(`${IP_HASH_SALT}:${ip}`).digest('hex')
}

export async function POST(req: Request) {
  try {
    if (!IP_HASH_SALT) {
      return NextResponse.json(
        { ok: false, error: 'Missing env: IP_HASH_SALT' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    const body = await req.json().catch(() => null)
    const candidateSlug = String(body?.candidateId ?? '').trim()

    if (!candidateSlug) {
      return NextResponse.json({ ok: false, error: 'Missing candidateId' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    // Candidate must exist
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

    // IP cap
    const ipHash = hashIp(await getClientIp())

    const { data: allowed, error: capErr } = await db.rpc('check_and_bump_pres_ip_cap', {
      p_ip_hash: ipHash,
      p_limit: MAX_PER_IP_PER_DAY,
    })

    if (capErr) {
      return NextResponse.json({ ok: false, error: capErr.message }, { status: 500, headers: NO_STORE_HEADERS })
    }

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          rateLimited: true,
          limit: MAX_PER_IP_PER_DAY,
          message: `Too many presidential votes from this network today (${MAX_PER_IP_PER_DAY}/day).`,
        },
        { status: 429, headers: NO_STORE_HEADERS }
      )
    }

    // Log for monitoring/rollback
    const { error: logErr } = await db.from('presidential_vote_log').insert({
      ip_hash: ipHash,
      candidate_slug: candidateSlug,
    })

    if (logErr) {
      return NextResponse.json({ ok: false, error: logErr.message }, { status: 500, headers: NO_STORE_HEADERS })
    }

    // Increment totals by slug
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
