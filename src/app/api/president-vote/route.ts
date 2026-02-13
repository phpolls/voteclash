import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

const COOKIE_NAME = 'a2h_voter_id'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

function getOrSetVoterId() {
  const jar = cookies()
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const candidateId = String(body?.candidateId ?? '').trim()
    if (!candidateId) {
      return new NextResponse('Missing candidateId', { status: 400, headers: NO_STORE_HEADERS })
    }

    const voterId = getOrSetVoterId()

    const { error } = await db.rpc('cast_presidential_vote', {
      candidate_id: candidateId,
      voter: voterId,
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      const already = msg.includes('duplicate') || msg.includes('unique')
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
