import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { randomUUID, createHash } from 'crypto'
import { db } from '@/lib/db'

const COOKIE_NAME = 'a2h_voter_id'
const MAX_PER_IP_PER_DAY = 5

const IP_HASH_SALT = process.env.IP_HASH_SALT as string
if (!IP_HASH_SALT) {
  throw new Error('Missing env: IP_HASH_SALT')
}

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

function getClientIp(): string {
  const h = headers()

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
    const body = await req.json().catch(() => null)
    const candidateId = String(body?.candidateId ?? '').trim()
    if (!candidateId) {
      return new NextResponse('Missing candidateId', { status: 400, headers: NO_STORE_HEADERS })
    }

    // ✅ Incognito defense: cap presidential votes per IP per day (shared across Vercel instances)
    const ip = getClientIp()
    const ipHash = hashIp(ip)

    const { data: allowed, error: capErr } = await db.rpc('check_and_bump_pres_ip_cap', {
      p_ip_hash: ipHash,
      p_limit: MAX_PER_IP_PER_DAY,
    })

    if (capErr) {
      return new NextResponse(capErr.message, { status: 500, headers: NO_STORE_HEADERS })
    }

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          rateLimited: true,
          message: 'Too many presidential votes from this network today. Try again tomorrow.',
        },
        { status: 429, headers: NO_STORE_HEADERS }
      )
    }

    const voterId = await getOrSetVoterId()

    // ✅ Hard one-vote-only enforcement (unique index in votes table)
    const { error } = await db.rpc('cast_presidential_vote', {
      candidate_id: candidateId,
      voter: voterId,
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      const already =
        msg.includes('duplicate') ||
        msg.includes('unique') ||
        msg.includes('votes_one_presidential_per_voter')

      if (already) {
        return NextResponse.json(
          { ok: false, alreadyVoted: true },
          { status: 200, headers: NO_STORE_HEADERS }
        )
      }

      return new NextResponse(error.message, { status: 500, headers: NO_STORE_HEADERS })
    }

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
  } catch (e: any) {
    return new NextResponse(e?.message || 'President vote failed', {
      status: 500,
      headers: NO_STORE_HEADERS,
    })
  }
}
