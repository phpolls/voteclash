import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const candidateId = String(body?.candidateId ?? '').trim()
    if (!candidateId) {
      return new NextResponse('Missing candidateId', {
        status: 400,
        headers: NO_STORE_HEADERS,
      })
    }

    const { error } = await db.rpc('increment_presidentiables_vote', { candidate_id: candidateId })
    if (error) {
      return new NextResponse(error.message, {
        status: 500,
        headers: NO_STORE_HEADERS,
      })
    }

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
  } catch (e: any) {
    return new NextResponse(e?.message || 'President vote failed', {
      status: 500,
      headers: NO_STORE_HEADERS,
    })
  }
}
